import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { withSharedRank } from '@/modules/operations/utils/with-shared-rank';
import {
  ANNOUNCER_ROLE,
  CONTACT_ROLES,
  UP_NEXT_DEPTH,
} from '@/modules/announcements/constants';

export type ShowStatus = 'today' | 'upcoming' | 'completed';

export interface AnnouncerShow {
  id: string;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ShowStatus;
}

/* Legacy derived today/upcoming/completed from the show's own dates rather
 * than from staff_assignments.status, and left a comment explaining why: that
 * column only ever holds 'pending' or 'accepted', so History could never
 * populate if you mapped straight from it (announcer.html:617-627).
 *
 * Legacy compared a single `date` field. Shows here carry start_date AND
 * end_date, so a multi-day show reads as "today" for its whole run instead of
 * only on opening day. */
function showStatus(startDate: string | null, endDate: string | null, todayIso: string): ShowStatus {
  const start = startDate ?? endDate;
  const end = endDate ?? startDate;
  if (!start || !end) return 'upcoming';
  if (end < todayIso) return 'completed';
  if (start > todayIso) return 'upcoming';
  return 'today';
}

const STATUS_ORDER: Record<ShowStatus, number> = { today: 0, upcoming: 1, completed: 2 };

export async function listMyShows(): Promise<AnnouncerShow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  /* Scoped to the Announcer role specifically. Without this filter someone
   * staffed as Judge on one show and Announcer on another got BOTH shows on
   * the announcer board — legacy passed `&role=Announcer` for exactly this
   * reason. The multi-role rail switcher is what moves them between
   * workspaces; the workspace itself stays single-role. */
  const { data: staffRows, error } = await supabase
    .from('staff_assignments')
    .select('show_id')
    .eq('role', ANNOUNCER_ROLE)
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (error) throw error;
  if (staffRows.length === 0) return [];

  const showIds = [...new Set(staffRows.map((s) => s.show_id))];
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, end_date')
    .in('id', showIds);
  if (showError) throw showError;

  const todayIso = new Date().toISOString().slice(0, 10);

  return shows
    .map((s) => ({
      id: s.id,
      name: s.name,
      dateLabel: s.date_label,
      startDate: s.start_date,
      endDate: s.end_date,
      status: showStatus(s.start_date, s.end_date, todayIso),
    }))
    /* Today's show must sort first. Ordering by start_date desc put the
     * furthest-FUTURE show at shows[0], so on a show day the announcer opened
     * the board onto the wrong show entirely. Within a bucket: soonest first
     * for today/upcoming, most recent first for completed. */
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      const av = a.startDate ?? '';
      const bv = b.startDate ?? '';
      return a.status === 'completed' ? bv.localeCompare(av) : av.localeCompare(bv);
    });
}

/* The show this workspace opens on: today's if there is one, else the next
 * one up. Shared by every announcing page so they never disagree. */
export function pickCurrentShow(
  shows: AnnouncerShow[],
  requestedShowId: string | undefined,
): AnnouncerShow | null {
  return shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;
}

export interface RingEntrySummary {
  num: string;
  rider: string | null;
  horse: string | null;
}

export interface RingRow {
  className: string;
  classId: string;
  ring: string | null;
  scoringOpen: boolean;
  position: number;
  entryCount: number;

  current: RingEntrySummary | null;

  upNext: RingEntrySummary[];
}

export async function getRingStatus(showId: string): Promise<RingRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label, location, arena, scoring_open, scoring_pos')
    .eq('show_id', showId)
    .order('label');
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, ride_order, status, holding')
    .in(
      'class_id',
      classes.map((c) => c.id),
    )
    .order('ride_order');
  if (entryError) throw entryError;

  const byClass = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = byClass.get(entry.class_id) ?? [];
    list.push(entry);
    byClass.set(entry.class_id, list);
  }

  return classes.map((cls) => {
    // Scratched rides are out of the running order entirely — legacy dropped
    // them at load (showstaff-ops.html loadRealOps) and this app's own
    // listSchedule already does. Filtering only `holding` here let a scratched
    // rider surface as "Now in ring" / "Next up" and inflated entryCount, so
    // the ops board and the Schedule tab disagreed about the same class.
    const list = (byClass.get(cls.id) ?? []).filter(
      (e) => !e.holding && e.status !== 'scratched',
    );
    const position = cls.scoring_pos ?? 0;
    const current = list[position] ?? null;
    const upNext = list
      .slice(position + 1, position + 1 + UP_NEXT_DEPTH)
      .map((e) => ({ num: e.num, rider: e.rider, horse: e.horse }));

    return {
      classId: cls.id,
      className: cls.label,
      ring: cls.location ?? cls.arena,
      scoringOpen: cls.scoring_open ?? false,
      position,
      entryCount: list.length,
      current: current ? { num: current.num, rider: current.rider, horse: current.horse } : null,
      upNext,
    };
  });
}

export interface ResultRow {
  classLabel: string;
  num: string;
  rider: string | null;
  horse: string | null;
  finalPct: string | null;
  place: number;
}

export async function getLiveResults(showId: string): Promise<ResultRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label')
    .eq('show_id', showId);
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, final_pct, status')
    .in(
      'class_id',
      classes.map((c) => c.id),
    );
  if (entryError) throw entryError;

  const labelById = new Map(classes.map((c) => [c.id, c.label]));
  const rows: ResultRow[] = [];

  for (const cls of classes) {
    const scored = entries
      .filter((e) => e.class_id === cls.id && e.status === 'scored')
      /* final_pct is mixed-type text: a number, or the sentinels 'SCR'/'ELIM'.
       * A scratched or eliminated ride is not placed — legacy filtered both out
       * before ranking (judge-scribe.html:421 realEntriesToRows), and the
       * announcer board rendered them as '—' rather than giving them a rosette.
       * Sorting them to 0 and letting them keep a place number put "ELIM, 5th"
       * on a board someone reads aloud. */
      .map((e) => ({
        entry: e,
        finalPctNum:
          e.final_pct != null &&
          e.final_pct !== 'SCR' &&
          e.final_pct !== 'ELIM' &&
          Number.isFinite(Number(e.final_pct))
            ? Number(e.final_pct)
            : null,
      }))
      .filter((r) => r.finalPctNum !== null)
      .sort((a, b) => (b.finalPctNum ?? 0) - (a.finalPctNum ?? 0));

    /* Two riders on the same percentage share a place — 1st, 1st, 3rd — which
     * is how every other placings surface in this app ranks (awards-engine,
     * operations results). index + 1 handed them 1st and 2nd, so the board
     * disagreed with the posted standings for the same class. */
    for (const ranked of withSharedRank(scored)) {
      rows.push({
        classLabel: labelById.get(cls.id) ?? '',
        num: ranked.entry.num,
        rider: ranked.entry.rider,
        horse: ranked.entry.horse,
        finalPct: ranked.entry.final_pct,
        place: ranked.place,
      });
    }
  }

  return rows;
}

export interface ScheduleRow {
  classId: string;
  className: string;
  ring: string | null;
  date: string | null;
  time: string | null;
  entryCount: number;
  scoringOpen: boolean;
}

/* Legacy had a Schedule tab but it was a stub — one row per assignment with a
 * hardcoded "8:00 AM – 5:00 PM" and no per-class times at all
 * (announcer.html:504). The classes table carries real date/time, so this is
 * the honest version of what that tab was reaching for. */
export async function listShowSchedule(showId: string): Promise<ScheduleRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label, display_name, arena, location, date, time, scoring_open')
    .eq('show_id', showId)
    .order('date')
    .order('time');
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, status, holding')
    .in(
      'class_id',
      classes.map((c) => c.id),
    );
  if (entryError) throw entryError;

  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.status === 'scratched' || e.holding) continue;
    counts.set(e.class_id, (counts.get(e.class_id) ?? 0) + 1);
  }

  return classes.map((c) => ({
    classId: c.id,
    className: c.display_name ?? c.label,
    ring: c.location ?? c.arena,
    date: c.date,
    time: c.time,
    entryCount: counts.get(c.id) ?? 0,
    scoringOpen: c.scoring_open ?? false,
  }));
}

export interface HistoryRow {
  showId: string;
  showName: string;
  dateLabel: string | null;
  startDate: string | null;
  classCount: number;
  scoredCount: number;
}

/* Legacy's History tab listed completed assignments with a "Result" column
 * that, in real mode, was never populated — `a.result` came only from the demo
 * roster, so a real announcer saw the literal string "undefined"
 * (announcer.html:529). Counting the classes and scored rides is the real
 * number that column was gesturing at. */
export async function listAnnouncerHistory(): Promise<HistoryRow[]> {
  const completed = (await listMyShows()).filter((s) => s.status === 'completed');
  if (completed.length === 0) return [];

  const supabase = await createServerClient();
  const showIds = completed.map((s) => s.id);

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, show_id')
    .in('show_id', showIds);
  if (error) throw error;

  const { data: entries, error: entryError } =
    classes.length > 0
      ? await supabase
          .from('class_entries')
          .select('class_id, status')
          .in(
            'class_id',
            classes.map((c) => c.id),
          )
          .eq('status', 'scored')
      : { data: [] as { class_id: string; status: string }[], error: null };
  if (entryError) throw entryError;

  const showIdByClass = new Map(classes.map((c) => [c.id, c.show_id]));
  const classCount = new Map<string, number>();
  const scoredCount = new Map<string, number>();
  for (const c of classes) classCount.set(c.show_id, (classCount.get(c.show_id) ?? 0) + 1);
  for (const e of entries) {
    const sid = showIdByClass.get(e.class_id);
    if (sid) scoredCount.set(sid, (scoredCount.get(sid) ?? 0) + 1);
  }

  return completed.map((s) => ({
    showId: s.id,
    showName: s.name,
    dateLabel: s.dateLabel,
    startDate: s.startDate,
    classCount: classCount.get(s.id) ?? 0,
    scoredCount: scoredCount.get(s.id) ?? 0,
  }));
}

export interface ShowContact {
  staffId: string;
  name: string;
  role: string;
  phone: string | null;
}

export async function listShowContacts(showId: string): Promise<ShowContact[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('staff_assignments')
    .select('id, name, role, phone')
    .eq('show_id', showId)
    .in('role', CONTACT_ROLES)
    .order('role')
    .order('name');
  if (error) throw error;

  return data.map((row) => ({ staffId: row.id, name: row.name, role: row.role, phone: row.phone }));
}

export interface ShowDocument {
  id: string;
  name: string;

  url: string | null;
}

export async function listShowDocuments(showId: string): Promise<ShowDocument[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, path, url')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;

  return Promise.all(
    data.map(async (d) => {
      let url = d.url;
      if (!url && d.path) {
        const { data: signed } = await supabase.storage
          .from('documents')
          .createSignedUrl(d.path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return { id: d.id, name: d.name, url };
    }),
  );
}
