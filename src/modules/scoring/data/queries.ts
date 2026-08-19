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
import type { ClassScoringState, MySeat, PanelSeat, RideEntry, ScoreRow } from '@/modules/scoring/types';
import type { Json } from '@/shared/types/database.types';

/**
 * Everything the live-scoring screen needs for one class, in one read —
 * mirrors legacy's `GET /api/shows/:id/scoring?classId=` response shape.
 *
 * Test resolution: `class_tests` first; if that class has never been
 * scored against a real test yet, falls back to `classes.catalog_id` →
 * `scoring_catalog.def`, and persists that fallback into `class_tests` so
 * subsequent reads hit the seeded row directly — matching legacy's own
 * write-in-a-GET behavior. Uses `upsert` rather than legacy's plain
 * `insert` (`class_tests.class_id` is unique) so two concurrent first-reads
 * can't race into a duplicate-key error; same persisted end state, same
 * user-visible behavior, just crash-safe under concurrency. Returns null
 * (never a fabricated definition) if neither resolves — the UI shows an
 * honest "no test defined" state, matching legacy's own banner.
 */
export async function getScoringState(classId: string): Promise<ClassScoringState> {
  const supabase = await createServerClient();

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select(
      'id, label, show_id, catalog_id, scoring_open, scoring_pos, working_in_entry_id, results_published, time, location'
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
        'id, num, rider, horse, ride_order, draw, status, holding, advanced_past, final_pct, judge_pct, collective_total, correction, reason, finalized_at, test_override, ride_started_at'
      )
      .eq('class_id', classId)
      .order('ride_order'),
    supabase
      .from('scores')
      .select(
        'id, entry_id, seat_id, movements, collectives, errors, error_at, remarks, final_remarks, submitted, signed_by, signed_at, updated_at'
      )
      .eq('class_id', classId),
  ]);
  if (showRes.error) throw showRes.error;
  if (classTestRes.error) throw classTestRes.error;
  if (panelRes.error) throw panelRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (scoresRes.error) throw scoresRes.error;

  let test = classTestRes.data ? parseTestDefinition(classTestRes.data.name, classTestRes.data) : null;

  if (!test && cls.catalog_id) {
    const { data: catalog, error: catalogError } = await supabase
      .from('scoring_catalog')
      .select('title, def')
      .eq('id', cls.catalog_id)
      .maybeSingle();
    if (catalogError) throw catalogError;
    test = catalog?.def ? parseTestDefinition(catalog.title, catalog.def) : null;

    if (test) {
      // Test resolution is infrastructure, not a user-authorized write —
      // legacy's own version ran with no permission gate at all. Seeded
      // with the admin client so a plain Judge/Scribe (no canEditShow)
      // isn't blocked by `class_tests_write`'s RLS on their own first
      // load of an under-configured class.
      const admin = createAdminClient();
      const { error: seedError } = await admin.from('class_tests').upsert(
        {
          class_id: classId,
          name: test.name,
          movements: test.movements as unknown as Json,
          collectives: test.collectives as unknown as Json,
        },
        { onConflict: 'class_id' }
      );
      if (seedError) throw seedError;
    }
  }

  const staffIds = [
    ...new Set(
      panelRes.data
        .flatMap((p) => [p.judge_staff_id, p.scribe_staff_id])
        .filter((id): id is string => id !== null)
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

  // Same "write in a read" shape as the class_tests catalog fallback above —
  // the moment the screen resolves who's currently being ridden, stamp a
  // real anchor for the Ride Time countdown if this is the first time this
  // entry has ever been current. Mirrors ScoringScreen's own currentEntry
  // resolution (workingInEntryId, else entries[scoring_pos]) so the two never
  // disagree about who "now" is.
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

/**
 * The test definition for one class, resolved the same way getScoringState
 * resolves it (class_tests, else catalog fallback) — used by mutations that
 * need to compute a percentage (advanceRide) without pulling in the whole
 * scoring-state read.
 */
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

/** Every Judge/Scribe staffed on this class's show — populates the live Panel Assignment editor's selects. */
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
    .filter((s): s is typeof s & { role: 'Judge' | 'Scribe' } => s.role === 'Judge' || s.role === 'Scribe')
    .map((s) => ({ staffId: s.id, name: s.name, role: s.role }));
}

/** Which seat, if any, the signed-in caller holds on this class's panel. */
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

/**
 * The signed-in caller's effective scoring permissions for this class's show
 * — org-level roles hold every permission implicitly (they're never a
 * staff_assignments row at all, same convention `modules/staff/utils.ts`
 * documents); everyone else resolves through `resolveScoringPermissions`
 * against their own staff_assignments row.
 */
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
