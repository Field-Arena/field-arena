import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { isRideFinished, pickRideInRing, resolveCurrentRideIndex } from '@/shared/lib/current-ride';
import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import { withSharedRank } from '@/shared/lib/with-shared-rank';
import { overrideTestName } from '@/shared/lib/rank-placings';
import { ANNOUNCER_ROLE, CONTACT_ROLES, UP_NEXT_DEPTH } from '@/modules/announcements/constants';
import type {
  AnnouncerShow,
  HistoryRow,
  ResultRow,
  RingRow,
  ScheduleRow,
  ShowContact,
  ShowDocument,
  ShowStatus,
} from '@/modules/announcements/types';

/* Legacy derived today/upcoming/completed from the show's own dates rather
 * than from staff_assignments.status, and left a comment explaining why: that
 * column only ever holds 'pending' or 'accepted', so History could never
 * populate if you mapped straight from it (announcer.html:617-627).
 *
 * Legacy compared a single `date` field. Shows here carry start_date AND
 * end_date, so a multi-day show reads as "today" for its whole run instead of
 * only on opening day. */
function showStatus(
  startDate: string | null,
  endDate: string | null,
  todayIso: string,
): ShowStatus {
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
    .select('id, slug, name, date_label, start_date, end_date, timezone, organizations(timezone)')
    .in('id', showIds);
  if (showError) throw showError;

  return (
    shows
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        dateLabel: s.date_label,
        startDate: s.start_date,
        endDate: s.end_date,
        // Today in the show's own zone — the server clock is UTC.
        status: showStatus(
          s.start_date,
          s.end_date,
          todayInZone(resolveTimeZone(s.timezone, s.organizations.timezone)),
        ),
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
      })
  );
}

/* The show this workspace opens on: today's if there is one, else the next
 * one up. Shared by every announcing page so they never disagree. */
export function pickCurrentShow(
  shows: AnnouncerShow[],
  requestedShowId: string | undefined,
): AnnouncerShow | null {
  return (
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null
  );
}

export async function getRingStatus(showId: string): Promise<RingRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label, location, arena, scoring_open, working_in_entry_id')
    .eq('show_id', showId)
    .order('label');
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('id, class_id, num, rider, horse, ride_order, status, holding, advanced_past')
    .in(
      'class_id',
      classes.map((c) => c.id),
    )
    .order('ride_order')
    .order('id');
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
    const classEntries = byClass.get(cls.id) ?? [];
    const list = classEntries.filter((e) => !e.holding && e.status !== 'scratched');
    // "Now in ring" is the first unfinished ride, matched the same way the
    // scoring screen does (resolveCurrentRideIndex) — never classes.scoring_pos
    // used as an index, which counts scratched rides this list has dropped.
    const asRide = (e: (typeof list)[number]) => ({
      status: e.status,
      advancedPast: e.advanced_past ?? false,
    });
    const position = resolveCurrentRideIndex(list.map(asRide));
    // During a work-in the judge is scoring the worked-in rider, not the next
    // in order — name the same rider the judge screen does (pickRideInRing).
    const current = pickRideInRing({
      workingInEntryId: cls.working_in_entry_id,
      rides: list,
      holdingRides: classEntries.filter((e) => (e.holding ?? false) || e.status === 'scratched'),
      pos: position,
    });
    // While a rider is worked in, the ride at `position` hasn't gone yet — it
    // is the first one up next.
    const workingIn = current !== null && current.id === cls.working_in_entry_id;
    const upNext = list
      .filter((e, i) => (workingIn ? i >= position && e.id !== current.id : i > position))
      .filter((e) => !isRideFinished(asRide(e)))
      .slice(0, UP_NEXT_DEPTH)
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
    .select('class_id, num, rider, horse, final_pct, status, collective_total, test_override')
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
        ctot: e.collective_total,
        testName: overrideTestName(e.test_override),
      }));

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
    showSlug: s.slug,
    showName: s.name,
    dateLabel: s.dateLabel,
    startDate: s.startDate,
    classCount: classCount.get(s.id) ?? 0,
    scoredCount: scoredCount.get(s.id) ?? 0,
  }));
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

export async function listShowDocuments(showId: string): Promise<ShowDocument[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, path, url')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;

  // Most rows already carry a stored url; only legacy rows without one need
  // signing. Batch those into a single storage call instead of one
  // createSignedUrl() round-trip per document.
  const pathsNeedingUrl = [...new Set(data.filter((d) => !d.url && d.path).map((d) => d.path))];
  const signedUrlByPath = new Map<string, string>();
  if (pathsNeedingUrl.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from('documents')
      .createSignedUrls(pathsNeedingUrl, 3600);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlByPath.set(s.path, s.signedUrl);
    }
  }

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    url: d.url ?? (d.path ? (signedUrlByPath.get(d.path) ?? null) : null),
  }));
}
