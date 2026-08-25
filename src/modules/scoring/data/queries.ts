import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { PERMISSION_KEYS, type PermissionKey } from '@/shared/constants/permissions';
import { asBooleanMap } from '@/modules/scoring/utils/as-boolean-map';
import { asStringMap } from '@/modules/scoring/utils/as-string-map';
import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';
import { parseMarkMap } from '@/modules/scoring/utils/parse-mark-map';
import { parseTestDefinition } from '@/modules/scoring/utils/parse-test-definition';
import { resolveScoringPermissions } from '@/modules/scoring/utils/resolve-scoring-permissions';
import type {
  ClassScoringState,
  MySeat,
  PanelSeat,
  RideEntry,
  ScoreRow,
} from '@/modules/scoring/types';
import type { Json } from '@/shared/types/database.types';

export async function getScoringState(classId: string): Promise<ClassScoringState> {
  const supabase = await createServerClient();

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select(
      'id, label, show_id, catalog_id, scoring_open, scoring_pos, working_in_entry_id, results_published, time, location, sponsor',
    )
    .eq('id', classId)
    .single();
  if (classError) throw classError;

  const [showRes, classTestRes, panelRes, entriesRes, scoresRes] = await Promise.all([
    supabase.from('shows').select('name').eq('id', cls.show_id).single(),
    supabase
      .from('class_tests')
      .select('name, movements, collectives')
      .eq('class_id', classId)
      .maybeSingle(),
    supabase
      .from('class_panel')
      .select('seat_id, position, judge_staff_id, scribe_staff_id')
      .eq('class_id', classId),
    supabase
      .from('class_entries')
      .select(
        'id, num, rider, horse, ride_order, draw, status, holding, advanced_past, final_pct, judge_pct, collective_total, correction, reason, finalized_at, test_override, ride_started_at',
      )
      .eq('class_id', classId)
      .order('ride_order'),
    supabase
      .from('scores')
      .select(
        'id, entry_id, seat_id, movements, collectives, errors, error_at, remarks, final_remarks, submitted, signed_by, signed_at, updated_at',
      )
      .eq('class_id', classId),
  ]);
  if (showRes.error) throw showRes.error;
  if (classTestRes.error) throw classTestRes.error;
  if (panelRes.error) throw panelRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (scoresRes.error) throw scoresRes.error;

  let test = classTestRes.data
    ? parseTestDefinition(classTestRes.data.name, classTestRes.data)
    : null;

  if (!test && cls.catalog_id) {
    const { data: catalog, error: catalogError } = await supabase
      .from('scoring_catalog')
      .select('title, def')
      .eq('id', cls.catalog_id)
      .maybeSingle();
    if (catalogError) throw catalogError;
    test = catalog?.def ? parseTestDefinition(catalog.title, catalog.def) : null;

    if (test) {
      const admin = createAdminClient();
      const { error: seedError } = await admin.from('class_tests').upsert(
        {
          class_id: classId,
          name: test.name,
          movements: test.movements as unknown as Json,
          collectives: test.collectives as unknown as Json,
        },
        { onConflict: 'class_id' },
      );
      if (seedError) throw seedError;
    }
  }

  const staffIds = [
    ...new Set(
      panelRes.data
        .flatMap((p) => [p.judge_staff_id, p.scribe_staff_id])
        .filter((id): id is string => id !== null),
    ),
  ];
  const { data: staffRows, error: staffError } =
    staffIds.length > 0
      ? await supabase.from('staff_assignments').select('id, name').in('id', staffIds)
      : { data: [] as { id: string; name: string }[], error: null };
  if (staffError) throw staffError;
  const nameById = new Map(staffRows.map((s) => [s.id, s.name]));

  const panel: PanelSeat[] = panelRes.data.map((p) => ({
    seatId: p.seat_id,
    position: p.position,
    judgeStaffId: p.judge_staff_id,
    judgeName: p.judge_staff_id ? (nameById.get(p.judge_staff_id) ?? null) : null,
    scribeStaffId: p.scribe_staff_id,
    scribeName: p.scribe_staff_id ? (nameById.get(p.scribe_staff_id) ?? null) : null,
  }));

  const allEntries: RideEntry[] = entriesRes.data.map((e) => ({
    id: e.id,
    num: e.num,
    rider: e.rider,
    horse: e.horse,
    rideOrder: e.ride_order,
    draw: e.draw,
    status: (e.status ?? 'scheduled') as RideEntry['status'],
    holding: e.holding ?? false,
    advancedPast: e.advanced_past ?? false,
    finalPct: e.final_pct,
    judgePct: isJsonRecord(e.judge_pct) ? asStringMap(e.judge_pct) : {},
    collectiveTotal: e.collective_total,
    correction: e.correction,
    reason: e.reason,
    finalizedAt: e.finalized_at,
    testOverride: parseTestDefinition(undefined, e.test_override),
    rideStartedAt: e.ride_started_at,
  }));
  const entries = allEntries.filter((e) => !e.holding);
  const holdingEntries = allEntries.filter((e) => e.holding);

  const currentEntry = cls.working_in_entry_id
    ? (allEntries.find((e) => e.id === cls.working_in_entry_id) ?? null)
    : (entries[cls.scoring_pos ?? 0] ?? null);
  if (currentEntry && !currentEntry.rideStartedAt) {
    const startedAt = new Date().toISOString();
    currentEntry.rideStartedAt = startedAt;
    const admin = createAdminClient();
    const { error: rideStartError } = await admin
      .from('class_entries')
      .update({ ride_started_at: startedAt })
      .eq('id', currentEntry.id);
    if (rideStartError) throw rideStartError;
  }

  const scores: ScoreRow[] = scoresRes.data.map((s) => ({
    id: s.id,
    entryId: s.entry_id,
    seatId: s.seat_id,
    movements: parseMarkMap(s.movements),
    collectives: parseMarkMap(s.collectives),
    errors: s.errors ?? 0,
    errorAt: asBooleanMap(s.error_at),
    remarks: asStringMap(s.remarks),
    finalRemarks: s.final_remarks ?? '',
    submitted: s.submitted ?? false,
    signedBy: s.signed_by,
    signedAt: s.signed_at,
    updatedAt: s.updated_at,
  }));

  return {
    classId,
    showName: showRes.data.name,
    className: cls.label,
    sponsor: cls.sponsor,
    test,
    panel,
    entries,
    holdingEntries,
    scores,
    classState: {
      open: cls.scoring_open ?? false,
      pos: cls.scoring_pos ?? 0,
      workingInEntryId: cls.working_in_entry_id,
      resultsPublished: cls.results_published ?? false,
    },
    scheduledTime: cls.time ?? null,
    ring: cls.location ?? null,
  };
}

export async function getTestForClass(classId: string) {
  const supabase = await createServerClient();

  const { data: classTest, error } = await supabase
    .from('class_tests')
    .select('name, movements, collectives')
    .eq('class_id', classId)
    .maybeSingle();
  if (error) throw error;
  if (classTest) return parseTestDefinition(classTest.name, classTest);

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('catalog_id')
    .eq('id', classId)
    .single();
  if (classError) throw classError;
  if (!cls.catalog_id) return null;

  const { data: catalog, error: catalogError } = await supabase
    .from('scoring_catalog')
    .select('title, def')
    .eq('id', cls.catalog_id)
    .maybeSingle();
  if (catalogError) throw catalogError;
  return catalog?.def ? parseTestDefinition(catalog.title, catalog.def) : null;
}

export interface PanelCandidate {
  staffId: string;
  name: string;
  role: 'Judge' | 'Scribe';
}

export async function listPanelCandidates(classId: string): Promise<PanelCandidate[]> {
  const supabase = await createServerClient();

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('show_id')
    .eq('id', classId)
    .single();
  if (classError) throw classError;

  const { data, error } = await supabase
    .from('staff_assignments')
    .select('id, name, role')
    .eq('show_id', cls.show_id)
    .in('role', ['Judge', 'Scribe']);
  if (error) throw error;

  return data
    .filter(
      (s): s is typeof s & { role: 'Judge' | 'Scribe' } =>
        s.role === 'Judge' || s.role === 'Scribe',
    )
    .map((s) => ({ staffId: s.id, name: s.name, role: s.role }));
}

export async function getMySeat(classId: string): Promise<MySeat | null> {
  const profile = await getStaffProfile();
  if (!profile) return null;

  const supabase = await createServerClient();

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('show_id')
    .eq('id', classId)
    .single();
  if (classError) throw classError;

  const { data: staffRows, error: staffError } = await supabase
    .from('staff_assignments')
    .select('id, name')
    .eq('show_id', cls.show_id)
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (staffError) throw staffError;
  if (staffRows.length === 0) return null;

  const staffIds = new Set(staffRows.map((s) => s.id));
  const nameById = new Map(staffRows.map((s) => [s.id, s.name]));

  const { data: seats, error: seatError } = await supabase
    .from('class_panel')
    .select('seat_id, judge_staff_id, scribe_staff_id')
    .eq('class_id', classId);
  if (seatError) throw seatError;

  for (const seat of seats) {
    if (seat.judge_staff_id && staffIds.has(seat.judge_staff_id)) {
      return {
        seatId: seat.seat_id,
        role: 'judge',
        staffId: seat.judge_staff_id,
        name: nameById.get(seat.judge_staff_id) ?? profile.name,
      };
    }
    if (seat.scribe_staff_id && staffIds.has(seat.scribe_staff_id)) {
      return {
        seatId: seat.seat_id,
        role: 'scribe',
        staffId: seat.scribe_staff_id,
        name: nameById.get(seat.scribe_staff_id) ?? profile.name,
      };
    }
  }
  return null;
}

const ORG_LEVEL_ROLES = new Set(['Organizer', 'Show Admin', 'SuperAdmin']);

export async function getMyScoringPermissions(classId: string) {
  const profile = await getStaffProfile();
  const allTrue = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Record<
    PermissionKey,
    boolean
  >;
  const allFalse = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<
    PermissionKey,
    boolean
  >;

  if (!profile) return allFalse;
  if (profile.platform_role && ORG_LEVEL_ROLES.has(profile.platform_role)) return allTrue;

  const supabase = await createServerClient();

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('show_id')
    .eq('id', classId)
    .single();
  if (classError) throw classError;

  const { data: staffRow, error: staffError } = await supabase
    .from('staff_assignments')
    .select('role, permissions, can_scratch_skip_dq, can_view_money')
    .eq('show_id', cls.show_id)
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`)
    .maybeSingle();
  if (staffError) throw staffError;
  if (!staffRow) return allFalse;

  return resolveScoringPermissions({
    role: staffRow.role,
    permissions: staffRow.permissions,
    canScratchSkipDq: staffRow.can_scratch_skip_dq,
    canViewMoney: staffRow.can_view_money,
  });
}
