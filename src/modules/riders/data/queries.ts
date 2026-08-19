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
  OrderRow,
  PublicShowDetail,
  RiderEntryDetail,
  RiderRow,
  RiderScorecard,
  RiderScorecardCard,
  WaiverSignatureRow,
} from '@/modules/riders/types';

/**
 * The signed-in rider's own profile, or null.
 *
 * A module-local twin of auth module's getRiderProfile (same query, same
 * `maybeSingle` reasoning) rather than an import of it — modules must not
 * reach into another module's internals (.claude/rules/folder-structure.md).
 */
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

/**
 * Active (non-scratched) class_entries count per class — the number
 * `scheduleExtras.maxRidersPerEvent` is checked against. Only called when a
 * cap is actually configured (see getPublicShowForRider).
 *
 * Uses the service-role client on purpose. `class_entries_select` RLS
 * (20260727120900_rls.sql) only lets a caller see their OWN entries
 * (`rider_id = auth.uid()`) or every entry in a show they have staff access
 * to (`can_view_show`) — an anonymous or rider-scoped client genuinely cannot
 * count another rider's entries, so this specific aggregate can't be done any
 * other way. Only a per-class count is returned to the caller, never the
 * underlying rows, so nothing rider-identifying leaks past this function —
 * the same information legacy's unrestricted server-side DB access always
 * exposed on the public ticket page.
 */
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

/**
 * Units already sold (across every rider's paid orders) per capped add-on.
 * Only called for add-ons that actually have `qty` set (see
 * getPublicShowForRider).
 *
 * Same service-role reasoning as getActiveEntryCountsByClass above:
 * `orders_select_owner` RLS only exposes a rider's own orders, but a public
 * "X remaining" figure has to sum every rider's paid orders for the show.
 * Only the summed quantities are returned — never order amounts, payment
 * ids, or which rider bought what.
 */
async function getSoldQuantityByAddOn(
  showId: string,
  addOnIds: string[]
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

/**
 * The public, rider-facing read of one show: what an anonymous visitor or a
 * signed-in rider sees on a show's ticket page. Mirrors legacy's handleShow
 * (api/rider/[resource].js).
 *
 * No published/suspended/demo gate is applied here — RLS already is that
 * gate. `shows_select_published` (20260727120900_rls.sql) hides the row
 * entirely from an anon/rider caller unless the show is published and its org
 * is neither suspended, soft-deleted, nor demo; `shows_select_staff`
 * separately lets a signed-in staff member with can_view_show() see it
 * regardless of publish state — which is what makes organizer preview
 * (legacy's rider.html?preview=1) work here for free, with no separate
 * preview code path to keep in sync.
 */
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

  // Rider cap per class — same "0/unset = no cap" rule as legacy's
  // classCapCheck. Only worth a query when a cap is actually configured.
  const cap = (show.schedule_extras as { maxRidersPerEvent?: number } | null)?.maxRidersPerEvent ?? 0;
  const entryCountByClass =
    cap && classes.length ? await getActiveEntryCountsByClass(classes.map((c) => c.id)) : {};
  const classesWithCapacity: ClassWithCapacity[] = classes.map((c) => ({
    ...c,
    entryCount: entryCountByClass[c.id] ?? 0,
    cap: cap || null,
  }));

  // Add-on remaining inventory — same "qty null = unlimited" rule as legacy.
  const cappedAddOnIds = addOns.filter((a) => a.qty != null).map((a) => a.id);
  const soldByAddOn = cappedAddOnIds.length
    ? await getSoldQuantityByAddOn(showId, cappedAddOnIds)
    : {};
  const addOnsWithRemaining: AddOnWithRemaining[] = addOns.map((a) => ({
    ...a,
    remaining: a.qty != null ? Math.max(0, a.qty - (soldByAddOn[a.id] ?? 0)) : null,
  }));

  // The Show details card's "Address" field — legacy's `sm-address` — comes
  // from the venue library, not the show row itself; shows only carry a
  // free-text venue *name* (see venue_name), address lives on venues.
  // `venues_select` RLS (20260727120900_rls.sql) is staff/org-only
  // (can_access_org), so an anon/rider caller gets nothing through the
  // regular client — same reasoning as getActiveEntryCountsByClass above:
  // the admin client reads only the one public field this card needs.
  let venueAddress: string | null = null;
  if (show.venue_id) {
    const admin = createAdminClient();
    const { data: venue, error: venueError } = await admin
      .from('venues')
      .select('address')
      .eq('id', show.venue_id)
      .maybeSingle();
    if (venueError) throw venueError;
    venueAddress = venue?.address ?? null;
  }

  return { show, classes: classesWithCapacity, addOns: addOnsWithRemaining, qualTypes, venueAddress };
}

/**
 * The signed-in rider's own horses, each with a freshly-signed read URL per
 * uploaded document. Mirrors legacy's handleHorses GET (api/rider/
 * [resource].js), including its degrade-gracefully behaviour: a signing
 * failure for one document (or a legacy-shaped row with no `path`) yields a
 * null `url` for that entry rather than failing the whole list.
 *
 * Returns an empty array when signed out, rather than throwing — this is a
 * "what does the current rider own" read, and having no rider is a normal,
 * renderable state (an empty horse list), not an error.
 */
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
      // Supabase Storage's createSignedUrl resolves to { data, error } rather
      // than rejecting on an ordinary API failure, so each entry below already
      // degrades to a null url on its own — no Promise.allSettled (and the
      // index-based fallback lookup it would need under
      // noUncheckedIndexedAccess) required.
      const documentUploads: HorseDocumentUploadWithUrl[] = await Promise.all(
        uploads.map(async (upload) => {
          if (!upload.path) return { ...upload, url: null };
          const { data: signed, error: signError } = await supabase.storage
            .from(HORSE_DOCUMENTS_BUCKET)
            .createSignedUrl(upload.path, HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS);
          if (signError) return { ...upload, url: null };
          return { ...upload, url: signed.signedUrl };
        })
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
    })
  );
}

/**
 * The rider's waiver signature for one show, or null if not yet signed.
 * Mirrors legacy's handleWaiver GET.
 */
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

// ---------------------------------------------------------------------------
// Phase D — post-purchase dashboard reads. Horse tab reuses listRiderHorses
// above unchanged (see ui/horse-manager.tsx's own comment on why it's the
// same live component pre- and post-purchase); Profile tab reuses RiderRow +
// data/mutations.ts's updateRiderProfile. Everything below is new to this
// phase.
// ---------------------------------------------------------------------------

/**
 * The signed-in rider's own class_entries for one show, joined with just the
 * class fields "your rides" and the Purchases entries table need. Mirrors
 * legacy's handleEntries (api/rider/[resource].js), server-side-scoped to one
 * show instead of client-filtered from an unscoped list.
 *
 * Two plain queries rather than a Postgres nested select, same style as
 * scoring module's getScoringState — `class_entries_select` RLS
 * (rider_id = auth.uid()) already limits the first query to the caller's own
 * rows; the second is scoped to this show's class ids so a rider's entries at
 * a *different* show can never leak into this show's schedule/purchases view.
 */
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

  // No `.order('ride_order')` — that column is scoped per class (see its own
  // partial index comment in 20260727120700_scoring.sql), not comparable
  // across a rider's entries in different classes; sorting by it here would
  // imply an ordering guarantee the column doesn't provide. Sorted below by
  // each entry's own class's date/time instead, which is actually comparable
  // across classes.
  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('id, class_id, horse_id, num, status, final_pct, reason, ride_order')
    .eq('rider_id', user.id)
    .in(
      'class_id',
      showClasses.map((c) => c.id)
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

  // Sort by the entry's own class's date/time (undated classes last, in
  // whatever order the query returned them), falling back to ride_order to
  // keep same-class entries in roster order.
  return detailed.sort((a, b) => {
    const aKey = a.class?.date ? `${a.class.date} ${a.class.time ?? ''}` : null;
    const bKey = b.class?.date ? `${b.class.date} ${b.class.time ?? ''}` : null;
    if (aKey && bKey && aKey !== bKey) return aKey < bKey ? -1 : 1;
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.rideOrder - b.rideOrder;
  });
}

/**
 * The signed-in rider's own orders for one show — backs both the Purchases
 * tab's tables/receipt and the stabling form's `orderId`. `orders_select_owner`
 * RLS (rider_id = auth.uid()) is enough on its own here, unlike checkout.ts's
 * admin-client reads: this never needs to see another rider's order.
 */
export async function listRiderOrdersForShow(showId: string): Promise<OrderRow[]> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('rider_id', user.id)
    .eq('show_id', showId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/** `class_tests`/`test_override`'s `movements` jsonb, `[{n|num, text, coef}]`, to the shape the scorecard renders. */
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

/** Same shape as parseScorecardMovements, for `collectives`: `[{key, label, coef}]`. */
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

/** A `scores.movements`/`.collectives` jsonb map (`{[key]: {value, enteredBy}}`) to a plain value lookup. */
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

/**
 * A signed judge's scorecard for one of the rider's own entries. Mirrors
 * legacy's handleScorecard (api/rider/[resource].js), including its central
 * rule: `cards` includes one entry per judge on the panel, but ONLY for
 * judges who have actually signed (`submitted && signed_by`) — an
 * in-progress or unsigned sheet is never exposed to the rider. Returns null
 * for an entry that doesn't exist or isn't the caller's (matching legacy's
 * 404), and `cards: []` — not an error — for "not ready yet", the same shape
 * for "hasn't been ridden" as for "ridden but not yet signed"; the caller
 * tells those apart via the entry's own status/finalPct.
 *
 * Uses the service-role admin client for `class_tests`/`class_panel`/
 * `staff_assignments`: those tables' RLS only lets *staff* read them
 * (`can_view_show`), not the rider whose ride it is — there's no policy for
 * "the entry's own rider" because normally a rider never needs to read them
 * directly (the scoring screen is staff-only). Only the specific fields a
 * scorecard needs are read and returned: no other rider's data, no staff
 * contact info, nothing beyond a judge's display name and the test's own
 * definition.
 */
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

  // scores_select_own_published RLS already returns nothing for a class whose
  // results aren't published yet — no separate published-check needed here.
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select(
      'seat_id, movements, collectives, errors, remarks, final_remarks, submitted, signed_by, signed_at'
    )
    .eq('entry_id', entryId);
  if (scoresError) throw scoresError;
  // `submitted` alone is the admission gate — matches legacy's handleScorecard
  // (`score && score.submitted`, api/rider/[resource].js). `signed_by` can be
  // null on a submitted sheet (a non-staff judge, or a submit that never named
  // a signer) and legacy still shows it; requiring both here would silently
  // withhold a scorecard legacy would have shown.
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

    // Iterate the panel, not the scores — matches legacy's own iteration
    // direction (api/rider/[resource].js loops `panelRows` and looks up the
    // score). A `scores` row whose seat no longer exists on `class_panel`
    // (a judge removed after scoring) is silently dropped, same as legacy;
    // the reverse loop would have surfaced it as a judgeless card instead.
    cards = panel
      .filter((seat) => submittedScores.has(seat.seat_id))
      .map((seat) => {
        const score = submittedScores.get(seat.seat_id);
        if (!score) throw new Error('unreachable: filtered on submittedScores.has');
        // Falls back to the literal 'Judge', matching legacy's `|| 'Judge'` —
        // not blank, and not this codebase's usual null-for-unknown pattern.
        const judgeName = (seat.judge_staff_id ? nameByStaffId.get(seat.judge_staff_id) : null) ?? 'Judge';
        const movementValues = parseScorecardMarkValues(score.movements);
        const remarks = (score.remarks ?? {}) as Record<string, unknown>;

        return {
          judgeName,
          position: seat.position,
          movements: testMovements.map((m) => ({
            ...m,
            value: movementValues[String(m.num)] ?? null,
            remark: typeof remarks[String(m.num)] === 'string' ? (remarks[String(m.num)] as string) : '',
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
