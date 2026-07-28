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
  seatId: string;
  position: string | null;
  /** 'judge' when holding the judge seat, 'scribe' when recording it. */
  seatRole: 'judge' | 'scribe';
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

  const [classes, entries, scores] = await Promise.all([
    supabase
      .from('classes')
      .select('id, label, show_id, date, scoring_open, results_published')
      .in('id', classIds),
    supabase.from('class_entries').select('id, class_id, status').in('class_id', classIds),
    supabase.from('scores').select('class_id, submitted').in('class_id', classIds),
  ]);
  if (classes.error) throw classes.error;
  if (entries.error) throw entries.error;
  if (scores.error) throw scores.error;

  const showIds = [...new Set(classes.data.map((c) => c.show_id))];
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label')
    .in('id', showIds);
  if (showError) throw showError;

  const showById = new Map(shows.map((s) => [s.id, s]));
  const classById = new Map(classes.data.map((c) => [c.id, c]));

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

      return {
        classId: cls.id,
        classLabel: cls.label,
        showId: cls.show_id,
        showName: show?.name ?? 'Unknown show',
        showDate: show?.date_label ?? cls.date,
        seatId: seat.seat_id,
        position: seat.position,
        seatRole: isJudge ? ('judge' as const) : ('scribe' as const),
        entryCount: entryCounts.get(cls.id) ?? 0,
        scoringOpen: cls.scoring_open ?? false,
        resultsPublished: cls.results_published ?? false,
        scoredCount: scoredCounts.get(cls.id) ?? 0,
      };
    })
    .filter((row): row is AssignmentRow => row !== null)
    .sort((a, b) => a.showName.localeCompare(b.showName) || a.classLabel.localeCompare(b.classLabel));
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
