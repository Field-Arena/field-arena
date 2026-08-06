import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';

/**
 * Judge and Scribe reads.
 *
 * Both roles shared judge-scribe.html in the legacy app, and they share this
 * module for the same reason: the screens are identical, only the scope differs.
 * A Judge sees classes where they hold the judge seat; a Scribe sees classes
 * where they are recording. That distinction comes from class_panel, which
 * carries both a judge and a scribe per seat.
 */

export interface AssignmentRow {
  classId: string;
  classLabel: string;
  showId: string;
  showName: string;
  showDate: string | null;
  /** Legacy split Today vs Upcoming on the show's own start date, not a per-class date — every class in a show shares one status. Matches that: sourced from shows.start_date. */
  classDate: string | null;
  classTime: string | null;
  ring: string | null;
  seatId: string;
  position: string | null;
  /** 'judge' when holding the judge seat, 'scribe' when recording it. */
  seatRole: 'judge' | 'scribe';
  /** Whoever holds the other seat on this same panel row, if anyone does yet. */
  partnerName: string | null;
  partnerRole: 'judge' | 'scribe' | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  scoredCount: number;
  /** Entries with advanced_past = true — scored, scratched, or disqualified. Drives the Results view's "complete" filter. */
  advancedCount: number;
}

/**
 * Every class this person is on a panel for, across every show.
 *
 * Deliberately not scoped to one show. A judge officiates across organizations
 * and needs one list of what they are booked on — which is exactly what the
 * legacy "My Assignments" panel showed.
 */
export async function listMyAssignments(): Promise<AssignmentRow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  // Which staff_assignments rows are this person. Matched on user_id first with
  // an email fallback, mirroring the RLS helpers: user_id is only populated once
  // the invite is accepted.
  const { data: staffRows, error: staffError } = await supabase
    .from('staff_assignments')
    .select('id, show_id')
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (staffError) throw staffError;
  if (staffRows.length === 0) return [];

  const staffIds = staffRows.map((s) => s.id);

  const { data: seats, error: seatError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, judge_staff_id, scribe_staff_id')
    .or(`judge_staff_id.in.(${staffIds.join(',')}),scribe_staff_id.in.(${staffIds.join(',')})`);
  if (seatError) throw seatError;
  if (seats.length === 0) return [];

  const classIds = [...new Set(seats.map((s) => s.class_id))];

  // Every staff id seated anywhere in these seats — including partners, not
  // just this person — so partnerName below is a name lookup, not a second query.
  const seatStaffIds = [
    ...new Set(
      seats
        .flatMap((s) => [s.judge_staff_id, s.scribe_staff_id])
        .filter((id): id is string => id !== null)
    ),
  ];

  const [classes, entries, scores, seatStaff] = await Promise.all([
    supabase
      .from('classes')
      .select('id, label, show_id, date, time, location, scoring_open, results_published')
      .in('id', classIds),
    supabase.from('class_entries').select('id, class_id, status, advanced_past').in('class_id', classIds),
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

      // A person could in principle hold both seats; judge takes precedence
      // because it is the role that signs the sheet.
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
    .sort((a, b) => a.showName.localeCompare(b.showName) || a.classLabel.localeCompare(b.classLabel));
}

export interface PanelContact {
  staffId: string;
  name: string;
  role: 'judge' | 'scribe';
  /** Every class of this person's this shared, so callers can filter to "today" honestly. */
  classIds: string[];
  showName: string;
  position: string | null;
}

/**
 * Everyone else seated on a panel for a class this person is also on —
 * across every seat for that class, not just the one they themselves hold.
 * A class can carry more than one judge/scribe pair (multiple `class_panel`
 * rows), so this is a class-id join, not just this person's own seats.
 * Backs both the Panel & Contacts tab and the status card's panel tooltip.
 */
export async function listPanelContacts(): Promise<PanelContact[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  const { data: staffRows, error: staffError } = await supabase
    .from('staff_assignments')
    .select('id')
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (staffError) throw staffError;
  if (staffRows.length === 0) return [];

  const myStaffIds = new Set(staffRows.map((s) => s.id));
  const myStaffIdList = [...myStaffIds];

  const { data: mySeats, error: mySeatError } = await supabase
    .from('class_panel')
    .select('class_id')
    .or(`judge_staff_id.in.(${myStaffIdList.join(',')}),scribe_staff_id.in.(${myStaffIdList.join(',')})`);
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
    if (seat.judge_staff_id && !myStaffIds.has(seat.judge_staff_id)) otherIds.add(seat.judge_staff_id);
    if (seat.scribe_staff_id && !myStaffIds.has(seat.scribe_staff_id)) otherIds.add(seat.scribe_staff_id);
  }
  if (otherIds.size === 0) return [];

  const [othersRes, classesRes] = await Promise.all([
    supabase.from('staff_assignments').select('id, name').in('id', [...otherIds]),
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
}

/** `class_entries.final_pct` is a mixed-type text column — a number as text, or 'SCR'/'ELIM'. */
function parseFinalPctNumber(raw: string | null): number | null {
  if (raw === null || raw === 'SCR' || raw === 'ELIM') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/** Every entry's final result for one class — feeds `rankPlacings` for the Results view and History's placings level. */
export async function getClassPlacings(classId: string): Promise<{ className: string; entries: ClassPlacingEntry[] }> {
  const supabase = await createServerClient();

  const [clsRes, entriesRes] = await Promise.all([
    supabase.from('classes').select('label').eq('id', classId).single(),
    supabase
      .from('class_entries')
      .select('id, num, rider, horse, final_pct, collective_total')
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
  test: { name: string; movements: { num: number; text: string; coef: number }[]; collectives: { key: string; label: string; coef: number }[] } | null;
  /** Movement number → averaged mark across every seat that scored it. */
  movementMarks: Record<string, number | null>;
  /** Movement number → the first non-empty remark across seats. */
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

/** One movement/collective key's numeric mark out of a `scores.movements`/`.collectives` jsonb map. */
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

/** One rider's full historical scorecard — the judge workspace History drill-down's third level. */
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
    supabase.from('class_tests').select('name, movements, collectives').eq('class_id', entry.class_id).maybeSingle(),
    supabase
      .from('scores')
      .select('movements, collectives, remarks')
      .eq('entry_id', entryId),
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
      values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000 : null;
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
      values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000 : null;
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

/** The start list for one class, in ride order. */
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
