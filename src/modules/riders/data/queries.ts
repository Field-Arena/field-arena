import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import {
  HORSE_DOCUMENTS_BUCKET,
  HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS,
  NON_CAPPED_ENTRY_STATUS,
} from '@/modules/riders/constants';
import type {
  AddOnWithRemaining,
  ClassEntryStatus,
  ClassWithCapacity,
  HorseDocumentUpload,
  HorseDocumentUploadWithUrl,
  HorseWithDocumentUrls,
  OrderLineItem,
  RiderVisibleOrderRow,
  PublicShowDetail,
  RiderEntryDetail,
  RiderRow,
  RiderScorecard,
  RiderScorecardCard,
  WaiverSignatureRow,
} from '@/modules/riders/types';

export async function getCurrentRiderProfile(): Promise<RiderRow | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('riders').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getActiveEntryCountsByClass(classIds: string[]): Promise<Record<string, number>> {
  if (!classIds.length) return {};

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('class_entries')
    .select('class_id, status')
    .in('class_id', classIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.status === NON_CAPPED_ENTRY_STATUS) continue;
    counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
  }
  return counts;
}

async function getSoldQuantityByAddOn(
  showId: string,
  addOnIds: string[],
): Promise<Record<string, number>> {
  if (!addOnIds.length) return {};

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('items')
    .eq('show_id', showId)
    .eq('status', 'paid');
  if (error) throw error;

  const sold: Record<string, number> = {};
  for (const order of data) {
    const items = (order.items ?? []) as unknown as OrderLineItem[];
    for (const item of items) {
      if (item.kind === 'addon' && item.refId && addOnIds.includes(item.refId)) {
        sold[item.refId] = (sold[item.refId] ?? 0) + (item.qty || 0);
      }
    }
  }
  return sold;
}

export async function getPublicShowForRider(showId: string): Promise<PublicShowDetail | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const [classesResult, addOnsResult, qualTypesResult] = await Promise.all([
    supabase.from('classes').select('*').eq('show_id', showId),
    supabase.from('add_ons').select('*').eq('show_id', showId).eq('enabled', true),
    supabase.from('qual_types').select('*').eq('show_id', showId).eq('enabled', true),
  ]);
  if (classesResult.error) throw classesResult.error;
  if (addOnsResult.error) throw addOnsResult.error;
  if (qualTypesResult.error) throw qualTypesResult.error;
  const classes = classesResult.data;
  const addOns = addOnsResult.data;
  const qualTypes = qualTypesResult.data;

  const cap =
    (show.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;
  const entryCountByClass =
    cap && classes.length ? await getActiveEntryCountsByClass(classes.map((c) => c.id)) : {};
  const classesWithCapacity: ClassWithCapacity[] = classes.map((c) => ({
    ...c,
    entryCount: entryCountByClass[c.id] ?? 0,
    cap: cap || null,
  }));

  const cappedAddOnIds = addOns.filter((a) => a.qty != null).map((a) => a.id);
  const soldByAddOn = cappedAddOnIds.length
    ? await getSoldQuantityByAddOn(showId, cappedAddOnIds)
    : {};
  const addOnsWithRemaining: AddOnWithRemaining[] = addOns.map((a) => ({
    ...a,
    remaining: a.qty != null ? Math.max(0, a.qty - (soldByAddOn[a.id] ?? 0)) : null,
  }));

  const admin = createAdminClient();

  let venueAddress: string | null = null;
  if (show.venue_id) {
    const { data: venue, error: venueError } = await admin
      .from('venues')
      .select('address')
      .eq('id', show.venue_id)
      .maybeSingle();
    if (venueError) throw venueError;
    venueAddress = venue?.address ?? null;
  }

  // Read through the admin client for the same reason venueAddress is: a rider
  // has no RLS grant on `organizations`. Only the fee model is taken.
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('fee_model, name')
    .eq('id', show.org_id)
    .maybeSingle();
  if (orgError) throw orgError;

  return {
    show,
    classes: classesWithCapacity,
    addOns: addOnsWithRemaining,
    qualTypes,
    venueAddress,
    feeModel: org?.fee_model ?? null,
    orgName: org?.name ?? null,
  };
}

export async function listRiderHorses(): Promise<HorseWithDocumentUrls[]> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: horses, error } = await supabase
    .from('horses')
    .select('*')
    .eq('rider_id', user.id)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return Promise.all(
    horses.map(async (horse) => {
      const uploads = (horse.document_uploads ?? []) as unknown as HorseDocumentUpload[];

      const documentUploads: HorseDocumentUploadWithUrl[] = await Promise.all(
        uploads.map(async (upload) => {
          if (!upload.path) return { ...upload, url: null };
          const { data: signed, error: signError } = await supabase.storage
            .from(HORSE_DOCUMENTS_BUCKET)
            .createSignedUrl(upload.path, HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS);
          if (signError) return { ...upload, url: null };
          return { ...upload, url: signed.signedUrl };
        }),
      );
      return {
        id: horse.id,
        rider_id: horse.rider_id,
        name: horse.name,
        stable: horse.stable,
        trainer: horse.trainer,
        trainer_phone: horse.trainer_phone,
        is_stallion: horse.is_stallion,
        created_at: horse.created_at,
        documentUploads,
      };
    }),
  );
}

export async function getWaiverSignature(showId: string): Promise<WaiverSignatureRow | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('waiver_signatures')
    .select('*')
    .eq('rider_id', user.id)
    .eq('show_id', showId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listRiderEntriesForShow(showId: string): Promise<RiderEntryDetail[]> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: showClasses, error: classListError } = await supabase
    .from('classes')
    .select('id, label, display_name, division, date, time, arena, results_published, test_options')
    .eq('show_id', showId);
  if (classListError) throw classListError;
  if (!showClasses.length) return [];
  const classById = new Map(showClasses.map((c) => [c.id, c]));

  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('id, class_id, horse_id, num, status, final_pct, reason, ride_order')
    .eq('rider_id', user.id)
    .in(
      'class_id',
      showClasses.map((c) => c.id),
    );
  if (entriesError) throw entriesError;

  const detailed = entries.map((entry) => {
    const cls = classById.get(entry.class_id);
    return {
      id: entry.id,
      classId: entry.class_id,
      horseId: entry.horse_id,
      num: entry.num,
      status: entry.status as ClassEntryStatus,
      finalPct: entry.final_pct,
      reason: entry.reason,
      rideOrder: entry.ride_order,
      class: cls
        ? {
            id: cls.id,
            label: cls.label,
            displayName: cls.display_name,
            division: cls.division,
            date: cls.date,
            time: cls.time,
            arena: cls.arena,
            resultsPublished: cls.results_published ?? false,
            testOptions: cls.test_options,
          }
        : null,
    };
  });

  return detailed.sort((a, b) => {
    const aKey = a.class?.date ? `${a.class.date} ${a.class.time ?? ''}` : null;
    const bKey = b.class?.date ? `${b.class.date} ${b.class.time ?? ''}` : null;
    if (aKey && bKey && aKey !== bKey) return aKey < bKey ? -1 : 1;
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.rideOrder - b.rideOrder;
  });
}

export async function listRiderOrdersForShow(showId: string): Promise<RiderVisibleOrderRow[]> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    /* Explicit column list, not `*`. This runs under the RIDER's own session,
     * and since 20260907120000 revoked table-level SELECT on `orders`, a `*`
     * expands to columns `authenticated` was deliberately not granted and the
     * whole query fails with 42501 — which threw out of here and took the
     * rider's show dashboard down with it. These are exactly the granted
     * columns; the two saved-card Stripe columns stay unreadable here by
     * design, and staff-side reads that need them go through the admin client. */
    .select(
      'id, rider_id, show_id, stripe_payment_intent_id, amount_total, status, items, fee_total, refunded_amount, created_at, paid_at, arrival_date, departure_date, additional_charges_total, additional_charges',
    )
    .eq('rider_id', user.id)
    .eq('show_id', showId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

function parseScorecardMovements(raw: unknown): { num: number; text: string; coef: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
    .map((m) => ({
      num: Number(m.n ?? m.num ?? 0),
      text: typeof m.text === 'string' ? m.text : '',
      coef: Number(m.coef ?? 1),
    }))
    .filter((m) => m.num > 0);
}

function parseScorecardCollectives(raw: unknown): { key: string; label: string; coef: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      key: typeof c.key === 'string' ? c.key : '',
      label: typeof c.label === 'string' ? c.label : '',
      coef: Number(c.coef ?? 1),
    }))
    .filter((c) => c.key !== '');
}

function parseScorecardMarkValues(raw: unknown): Record<string, number | null> {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Record<string, number | null> = {};
  for (const [key, mark] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof mark === 'object' && mark !== null && 'value' in mark) {
      const value = mark.value;
      out[key] = typeof value === 'number' ? value : null;
    } else if (typeof mark === 'number') {
      out[key] = mark;
    }
  }
  return out;
}

export async function getRiderScorecard(entryId: string): Promise<RiderScorecard | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: entry, error: entryError } = await supabase
    .from('class_entries')
    .select('id, class_id, rider_id, num, rider, horse, final_pct, test_override')
    .eq('id', entryId)
    .maybeSingle();
  if (entryError) throw entryError;
  if (entry?.rider_id !== user.id) return null;

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('id, show_id, label, display_name')
    .eq('id', entry.class_id)
    .maybeSingle();
  if (classError) throw classError;
  if (!cls) return null;

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('name')
    .eq('id', cls.show_id)
    .maybeSingle();
  if (showError) throw showError;

  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select(
      'seat_id, movements, collectives, errors, remarks, final_remarks, submitted, signed_by, signed_at',
    )
    .eq('entry_id', entryId);
  if (scoresError) throw scoresError;

  const submittedScores = new Map(scores.filter((s) => s.submitted).map((s) => [s.seat_id, s]));

  const testOverride = entry.test_override as {
    name?: string;
    movements?: unknown;
    collectives?: unknown;
  } | null;

  const admin = createAdminClient();
  let testName = cls.display_name ?? cls.label;
  let testMovements: { num: number; text: string; coef: number }[] = [];
  let testCollectives: { key: string; label: string; coef: number }[] = [];
  let cards: RiderScorecardCard[] = [];

  if (testOverride) {
    testName = testOverride.name ?? testName;
    testMovements = parseScorecardMovements(testOverride.movements);
    testCollectives = parseScorecardCollectives(testOverride.collectives);
  } else {
    const { data: test, error: testError } = await admin
      .from('class_tests')
      .select('name, movements, collectives')
      .eq('class_id', entry.class_id)
      .maybeSingle();
    if (testError) throw testError;
    if (test) {
      testName = test.name;
      testMovements = parseScorecardMovements(test.movements);
      testCollectives = parseScorecardCollectives(test.collectives);
    }
  }

  if (submittedScores.size > 0) {
    const { data: panel, error: panelError } = await admin
      .from('class_panel')
      .select('seat_id, position, judge_staff_id')
      .eq('class_id', entry.class_id);
    if (panelError) throw panelError;

    const judgeStaffIds = panel
      .map((seat) => seat.judge_staff_id)
      .filter((id): id is string => Boolean(id));
    const nameByStaffId = new Map<string, string>();
    if (judgeStaffIds.length) {
      const { data: staff, error: staffError } = await admin
        .from('staff_assignments')
        .select('id, name')
        .in('id', judgeStaffIds);
      if (staffError) throw staffError;
      for (const person of staff) nameByStaffId.set(person.id, person.name);
    }

    cards = panel
      .filter((seat) => submittedScores.has(seat.seat_id))
      .map((seat) => {
        const score = submittedScores.get(seat.seat_id);
        if (!score) throw new Error('unreachable: filtered on submittedScores.has');

        const judgeName =
          (seat.judge_staff_id ? nameByStaffId.get(seat.judge_staff_id) : null) ?? 'Judge';
        const movementValues = parseScorecardMarkValues(score.movements);
        const remarks = (score.remarks ?? {}) as Record<string, unknown>;

        return {
          judgeName,
          position: seat.position,
          movements: testMovements.map((m) => ({
            ...m,
            value: movementValues[String(m.num)] ?? null,
            remark:
              typeof remarks[String(m.num)] === 'string' ? (remarks[String(m.num)] as string) : '',
          })),
          collectives: testCollectives.map((c) => ({
            ...c,
            value: parseScorecardMarkValues(score.collectives)[c.key] ?? null,
          })),
          finalRemarks: score.final_remarks ?? '',
          errors: score.errors ?? 0,
          signedBy: score.signed_by,
          signedAt: score.signed_at,
        };
      });
  }

  return {
    showName: show?.name ?? '',
    className: cls.display_name ?? cls.label,
    testName,
    num: entry.num,
    rider: entry.rider,
    horse: entry.horse,
    finalPct: entry.final_pct,
    cards,
  };
}
