import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getPreviewShowId } from '@/shared/lib/preview-show';

export interface AssignmentRow {
  classId: string;
  classLabel: string;
  showId: string;
  showName: string;
  showDate: string | null;

  classDate: string | null;
  classTime: string | null;
  ring: string | null;
  seatId: string;
  position: string | null;

  seatRole: 'judge' | 'scribe';

  partnerName: string | null;
  partnerRole: 'judge' | 'scribe' | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  scoredCount: number;

  advancedCount: number;
}

/* Which staff_assignments rows this screen speaks for.
 *
 * Normally that is the caller's own — a judge sees their own panel seats. A
 * SuperAdmin holds no staff rows at all, so when they have picked a show to
 * preview, this stands in the shoes of everyone staffed on THAT show: the
 * result is that show's real panel, classes and entries, which is what legacy
 * loaded when you chose "Judge · <show>" from its Viewing-as menu. */
async function assignmentScopeStaffIds(profile: {
  id: string;
  email: string;
  platform_role: string | null;
}): Promise<string[]> {
  const supabase = await createServerClient();

  if (profile.platform_role === 'SuperAdmin') {
    const previewShowId = await getPreviewShowId();
    if (!previewShowId) return [];

    const { data, error } = await supabase
      .from('staff_assignments')
      .select('id')
      .eq('show_id', previewShowId)
      .in('role', ['Judge', 'Scribe']);
    if (error) throw error;
    return data.map((s) => s.id);
  }

  const { data, error } = await supabase
    .from('staff_assignments')
    .select('id')
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (error) throw error;
  return data.map((s) => s.id);
}

export async function listMyAssignments(): Promise<AssignmentRow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  const staffIds = await assignmentScopeStaffIds(profile);
  if (staffIds.length === 0) return [];

  const { data: seats, error: seatError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, judge_staff_id, scribe_staff_id')
    .or(`judge_staff_id.in.(${staffIds.join(',')}),scribe_staff_id.in.(${staffIds.join(',')})`);
  if (seatError) throw seatError;
  if (seats.length === 0) return [];

  const classIds = [...new Set(seats.map((s) => s.class_id))];

  const seatStaffIds = [
    ...new Set(
      seats
        .flatMap((s) => [s.judge_staff_id, s.scribe_staff_id])
        .filter((id): id is string => id !== null),
    ),
  ];

  const [classes, entries, scores, seatStaff] = await Promise.all([
    supabase
      .from('classes')
      .select('id, label, show_id, date, time, location, scoring_open, results_published')
      .in('id', classIds),
    supabase
      .from('class_entries')
      .select('id, class_id, status, advanced_past')
      .in('class_id', classIds),
    supabase.from('scores').select('class_id, submitted').in('class_id', classIds),
    supabase.from('staff_assignments').select('id, name').in('id', seatStaffIds),
  ]);
  if (classes.error) throw classes.error;
  if (entries.error) throw entries.error;
  if (scores.error) throw scores.error;
  if (seatStaff.error) throw seatStaff.error;

  const showIds = [...new Set(classes.data.map((c) => c.show_id))];
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date')
    .in('id', showIds);
  if (showError) throw showError;

  const showById = new Map(shows.map((s) => [s.id, s]));
  const classById = new Map(classes.data.map((c) => [c.id, c]));
  const seatStaffNameById = new Map(seatStaff.data.map((s) => [s.id, s.name]));

  const entryCounts = new Map<string, number>();
  const advancedCounts = new Map<string, number>();
  for (const entry of entries.data) {
    entryCounts.set(entry.class_id, (entryCounts.get(entry.class_id) ?? 0) + 1);
    if (entry.advanced_past) {
      advancedCounts.set(entry.class_id, (advancedCounts.get(entry.class_id) ?? 0) + 1);
    }
  }

  const scoredCounts = new Map<string, number>();
  for (const score of scores.data) {
    if (score.submitted) {
      scoredCounts.set(score.class_id, (scoredCounts.get(score.class_id) ?? 0) + 1);
    }
  }

  const staffIdSet = new Set(staffIds);

  return seats
    .map((seat) => {
      const cls = classById.get(seat.class_id);
      if (!cls) return null;
      const show = showById.get(cls.show_id);

      const isJudge = seat.judge_staff_id !== null && staffIdSet.has(seat.judge_staff_id);
      const partnerId = isJudge ? seat.scribe_staff_id : seat.judge_staff_id;

      return {
        classId: cls.id,
        classLabel: cls.label,
        showId: cls.show_id,
        showName: show?.name ?? 'Unknown show',
        showDate: show?.date_label ?? cls.date,
        classDate: show?.start_date ?? null,
        classTime: cls.time,
        ring: cls.location,
        seatId: seat.seat_id,
        position: seat.position,
        seatRole: isJudge ? ('judge' as const) : ('scribe' as const),
        partnerName: partnerId ? (seatStaffNameById.get(partnerId) ?? null) : null,
        partnerRole: partnerId ? (isJudge ? ('scribe' as const) : ('judge' as const)) : null,
        entryCount: entryCounts.get(cls.id) ?? 0,
        scoringOpen: cls.scoring_open ?? false,
        resultsPublished: cls.results_published ?? false,
        scoredCount: scoredCounts.get(cls.id) ?? 0,
        advancedCount: advancedCounts.get(cls.id) ?? 0,
      };
    })
    .filter((row): row is AssignmentRow => row !== null)
    .sort(
      (a, b) => a.showName.localeCompare(b.showName) || a.classLabel.localeCompare(b.classLabel),
    );
}

export interface PanelContact {
  staffId: string;
  name: string;
  role: 'judge' | 'scribe';

  classIds: string[];
  showName: string;
  position: string | null;
}

export async function listPanelContacts(): Promise<PanelContact[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  // Same scope as listMyAssignments: a judge's own seats, or — when a
  // SuperAdmin is previewing a show — the seats of that show's panel. Without
  // this the preview showed real assignments beside an empty panel.
  const staffIds = await assignmentScopeStaffIds(profile);
  if (staffIds.length === 0) return [];

  const myStaffIds = new Set(staffIds);
  const myStaffIdList = [...myStaffIds];

  const { data: mySeats, error: mySeatError } = await supabase
    .from('class_panel')
    .select('class_id')
    .or(
      `judge_staff_id.in.(${myStaffIdList.join(',')}),scribe_staff_id.in.(${myStaffIdList.join(',')})`,
    );
  if (mySeatError) throw mySeatError;
  if (mySeats.length === 0) return [];

  const classIds = [...new Set(mySeats.map((s) => s.class_id))];

  const { data: seats, error: seatError } = await supabase
    .from('class_panel')
    .select('class_id, position, judge_staff_id, scribe_staff_id')
    .in('class_id', classIds);
  if (seatError) throw seatError;

  const otherIds = new Set<string>();
  for (const seat of seats) {
    if (seat.judge_staff_id && !myStaffIds.has(seat.judge_staff_id))
      otherIds.add(seat.judge_staff_id);
    if (seat.scribe_staff_id && !myStaffIds.has(seat.scribe_staff_id))
      otherIds.add(seat.scribe_staff_id);
  }
  if (otherIds.size === 0) return [];

  const [othersRes, classesRes] = await Promise.all([
    supabase
      .from('staff_assignments')
      .select('id, name')
      .in('id', [...otherIds]),
    supabase.from('classes').select('id, show_id').in('id', classIds),
  ]);
  if (othersRes.error) throw othersRes.error;
  if (classesRes.error) throw classesRes.error;

  const showIds = [...new Set(classesRes.data.map((c) => c.show_id))];
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name')
    .in('id', showIds);
  if (showError) throw showError;

  const nameById = new Map(othersRes.data.map((o) => [o.id, o.name]));
  const classById = new Map(classesRes.data.map((c) => [c.id, c]));
  const showNameById = new Map(shows.map((s) => [s.id, s.name]));

  const byKey = new Map<string, PanelContact>();
  for (const seat of seats) {
    const cls = classById.get(seat.class_id);
    if (!cls) continue;
    const showName = showNameById.get(cls.show_id) ?? 'Unknown show';

    const occupants: [string | null, 'judge' | 'scribe'][] = [
      [seat.judge_staff_id, 'judge'],
      [seat.scribe_staff_id, 'scribe'],
    ];

    for (const [staffId, role] of occupants) {
      if (!staffId || myStaffIds.has(staffId)) continue;
      const name = nameById.get(staffId);
      if (!name) continue;

      const key = `${staffId}|${cls.show_id}|${role}`;
      const existing = byKey.get(key);
      if (existing) {
        if (!existing.classIds.includes(seat.class_id)) existing.classIds.push(seat.class_id);
      } else {
        byKey.set(key, {
          staffId,
          name,
          role,
          classIds: [seat.class_id],
          showName,
          position: seat.position,
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface TodayPanelContact {
  name: string;
  role: 'judge' | 'scribe';
  position: string | null;
}

export interface RideOrderEntry {
  id: string;
  num: string;
  rider: string | null;
  horse: string | null;
  rideOrder: number;
  status: string;
  finalPct: string | null;
  holding: boolean;
}

export interface ClassPlacingEntry {
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  finalPct: number | null;
  ctot: number | null;
  testName: string | null;
}

function parseFinalPctNumber(raw: string | null): number | null {
  if (raw === null || raw === 'SCR' || raw === 'ELIM') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/* A Test of Choice class stores each rider's chosen test as a full
 * definition snapshot in test_override (see checkout.ts) — only the name
 * is needed here to group placings per test. An ordinary class has no
 * override on any entry, so every row's testName is null and ranking
 * behaves exactly as it always did (one pool, one set of ribbons). */
function extractTestName(override: unknown): string | null {
  if (!override || typeof override !== 'object') return null;
  const name = (override as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

export async function getClassPlacings(
  classId: string,
): Promise<{ className: string; entries: ClassPlacingEntry[] }> {
  const supabase = await createServerClient();

  const [clsRes, entriesRes] = await Promise.all([
    supabase.from('classes').select('label').eq('id', classId).single(),
    supabase
      .from('class_entries')
      .select('id, num, rider, horse, final_pct, collective_total, test_override')
      .eq('class_id', classId)
      .order('ride_order'),
  ]);
  if (clsRes.error) throw clsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  return {
    className: clsRes.data.label,
    entries: entriesRes.data.map((e) => ({
      entryId: e.id,
      num: e.num,
      rider: e.rider ?? '—',
      horse: e.horse ?? '—',
      finalPct: parseFinalPctNumber(e.final_pct),
      ctot: e.collective_total,
      testName: extractTestName(e.test_override),
    })),
  };
}

export interface EntryScorecard {
  className: string;
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  finalPct: string | null;
  test: {
    name: string;
    movements: { num: number; text: string; coef: number }[];
    collectives: { key: string; label: string; coef: number }[];
  } | null;

  movementMarks: Record<string, number | null>;

  movementRemarks: Record<string, string>;
  collectiveMarks: Record<string, number | null>;
}

function isJsonRecordLocal(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMovementsList(json: unknown): { num: number; text: string; coef: number }[] {
  if (!Array.isArray(json)) return [];
  return (json as unknown[])
    .filter(isJsonRecordLocal)
    .map((m) => ({
      num: Number(m.n ?? m.num ?? 0),
      text: typeof m.text === 'string' ? m.text : '',
      coef: Number(m.coef ?? 1),
    }))
    .filter((m) => m.num > 0);
}

function parseCollectivesList(json: unknown): { key: string; label: string; coef: number }[] {
  if (!Array.isArray(json)) return [];
  return (json as unknown[])
    .filter(isJsonRecordLocal)
    .map((c) => ({
      key: typeof c.key === 'string' ? c.key : '',
      label: typeof c.label === 'string' ? c.label : '',
      coef: Number(c.coef ?? 1),
    }))
    .filter((c) => c.key !== '');
}

function markValue(json: unknown, key: string): number | null {
  if (!isJsonRecordLocal(json)) return null;
  const entry = json[key];
  if (!isJsonRecordLocal(entry)) return null;
  return typeof entry.value === 'number' ? entry.value : null;
}

function remarkValue(json: unknown, key: string): string {
  if (!isJsonRecordLocal(json)) return '';
  const value = json[key];
  return typeof value === 'string' ? value : '';
}

export async function getEntryScorecard(entryId: string): Promise<EntryScorecard | null> {
  const supabase = await createServerClient();

  const { data: entry, error: entryError } = await supabase
    .from('class_entries')
    .select('id, class_id, num, rider, horse, final_pct, test_override')
    .eq('id', entryId)
    .maybeSingle();
  if (entryError) throw entryError;
  if (!entry) return null;

  const [clsRes, classTestRes, scoresRes] = await Promise.all([
    supabase.from('classes').select('label, catalog_id').eq('id', entry.class_id).single(),
    supabase
      .from('class_tests')
      .select('name, movements, collectives')
      .eq('class_id', entry.class_id)
      .maybeSingle(),
    supabase.from('scores').select('movements, collectives, remarks').eq('entry_id', entryId),
  ]);
  if (clsRes.error) throw clsRes.error;
  if (classTestRes.error) throw classTestRes.error;
  if (scoresRes.error) throw scoresRes.error;

  let resolvedName: string | null = null;
  let movementsRaw: unknown = [];
  let collectivesRaw: unknown = [];

  if (classTestRes.data) {
    resolvedName = classTestRes.data.name;
    movementsRaw = classTestRes.data.movements;
    collectivesRaw = classTestRes.data.collectives;
  } else if (isJsonRecordLocal(entry.test_override)) {
    const t = entry.test_override;
    resolvedName = typeof t.name === 'string' ? t.name : '';
    movementsRaw = t.movements;
    collectivesRaw = t.collectives;
  } else if (clsRes.data.catalog_id) {
    const { data: catalog, error: catalogError } = await supabase
      .from('scoring_catalog')
      .select('title, def')
      .eq('id', clsRes.data.catalog_id)
      .maybeSingle();
    if (catalogError) throw catalogError;
    if (catalog?.def && isJsonRecordLocal(catalog.def)) {
      resolvedName = catalog.title;
      movementsRaw = catalog.def.movements;
      collectivesRaw = catalog.def.collectives;
    }
  }

  const movements = parseMovementsList(movementsRaw);
  const collectives = parseCollectivesList(collectivesRaw);

  const movementMarks: Record<string, number | null> = {};
  const movementRemarks: Record<string, string> = {};
  for (const m of movements) {
    const key = String(m.num);
    const values: number[] = [];
    let remark = '';
    for (const score of scoresRes.data) {
      const v = markValue(score.movements, key);
      if (v !== null) values.push(v);
      if (!remark) remark = remarkValue(score.remarks, key);
    }
    movementMarks[key] =
      values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000
        : null;
    movementRemarks[key] = remark;
  }

  const collectiveMarks: Record<string, number | null> = {};
  for (const c of collectives) {
    const values: number[] = [];
    for (const score of scoresRes.data) {
      const v = markValue(score.collectives, c.key);
      if (v !== null) values.push(v);
    }
    collectiveMarks[c.key] =
      values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000
        : null;
  }

  return {
    className: clsRes.data.label,
    entryId: entry.id,
    num: entry.num,
    rider: entry.rider ?? '—',
    horse: entry.horse ?? '—',
    finalPct: entry.final_pct,
    test: resolvedName !== null ? { name: resolvedName, movements, collectives } : null,
    movementMarks,
    movementRemarks,
    collectiveMarks,
  };
}

export async function getRideOrder(classId: string): Promise<RideOrderEntry[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('class_entries')
    .select('id, num, rider, horse, ride_order, status, final_pct, holding')
    .eq('class_id', classId)
    .order('ride_order');
  if (error) throw error;

  return data.map((e) => ({
    id: e.id,
    num: e.num,
    rider: e.rider,
    horse: e.horse,
    rideOrder: e.ride_order,
    status: e.status ?? 'scheduled',
    finalPct: e.final_pct,
    holding: e.holding ?? false,
  }));
}

/** Name of the show a SuperAdmin is previewing, or null when none is picked. */
export async function getPreviewShowName(): Promise<string | null> {
  const showId = await getPreviewShowId();
  if (!showId) return null;

  const supabase = await createServerClient();
  const { data } = await supabase.from('shows').select('name').eq('id', showId).maybeSingle();
  return data?.name ?? null;
}
