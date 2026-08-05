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
  /** The class's own date/time/ring, distinct from showDate — used to split Today vs Upcoming. */
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
    supabase.from('class_entries').select('id, class_id, status').in('class_id', classIds),
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
    .select('id, name, date_label')
    .in('id', showIds);
  if (showError) throw showError;

  const showById = new Map(shows.map((s) => [s.id, s]));
  const classById = new Map(classes.data.map((c) => [c.id, c]));
  const seatStaffNameById = new Map(seatStaff.data.map((s) => [s.id, s.name]));

  const entryCounts = new Map<string, number>();
  for (const entry of entries.data) {
    entryCounts.set(entry.class_id, (entryCounts.get(entry.class_id) ?? 0) + 1);
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
        classDate: cls.date,
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
