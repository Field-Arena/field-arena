import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';

/**
 * Announcer reads, ported from announcer.html: active rings, what is up next, and
 * live results.
 *
 * The announcer is read-only by design. Their permission defaults are empty —
 * they call what is happening, they do not change it — so this module has no
 * mutations at all.
 */

export interface AnnouncerShow {
  id: string;
  name: string;
  dateLabel: string | null;
}

/** Shows this announcer is staffed on. */
export async function listMyShows(): Promise<AnnouncerShow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  const { data: staffRows, error } = await supabase
    .from('staff_assignments')
    .select('show_id')
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`);
  if (error) throw error;
  if (staffRows.length === 0) return [];

  const showIds = [...new Set(staffRows.map((s) => s.show_id))];
  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label')
    .in('id', showIds)
    .order('start_date', { ascending: false });
  if (showError) throw showError;

  return shows.map((s) => ({ id: s.id, name: s.name, dateLabel: s.date_label }));
}

export interface RingRow {
  className: string;
  classId: string;
  ring: string | null;
  scoringOpen: boolean;
  position: number;
  entryCount: number;
  nextUp: { num: string; rider: string | null; horse: string | null } | null;
}

/**
 * Ring status: which classes are live and who rides next.
 *
 * `scoring_pos` is the class's own cursor into its ride order, so "next up" is
 * derived from it rather than from whichever entry happens to be unscored — a
 * scratched or worked-in rider would make that wrong.
 */
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
      classes.map((c) => c.id)
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
    // Holding-queue entries are outside the numbered order and only ride when
    // explicitly worked in, so they are excluded from "next up".
    const list = (byClass.get(cls.id) ?? []).filter((e) => !e.holding);
    const position = cls.scoring_pos ?? 0;
    const next = list[position] ?? null;

    return {
      classId: cls.id,
      className: cls.label,
      ring: cls.location ?? cls.arena,
      scoringOpen: cls.scoring_open ?? false,
      position,
      entryCount: list.length,
      nextUp: next ? { num: next.num, rider: next.rider, horse: next.horse } : null,
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

/**
 * Published results only.
 *
 * Unpublished marks are deliberately excluded: a class still being scored has no
 * standings, and announcing a placing that later changes is worse than saying
 * nothing. results_published is the gate.
 */
export async function getLiveResults(showId: string): Promise<ResultRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label')
    .eq('show_id', showId)
    .eq('results_published', true);
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, final_pct, status')
    .in(
      'class_id',
      classes.map((c) => c.id)
    );
  if (entryError) throw entryError;

  const labelById = new Map(classes.map((c) => [c.id, c.label]));
  const rows: ResultRow[] = [];

  for (const cls of classes) {
    const scored = entries
      .filter((e) => e.class_id === cls.id && e.status === 'scored' && e.final_pct)
      // final_pct is mixed-type text — a number, or 'SCR'/'ELIM'. Only numeric
      // values rank, so anything unparseable sorts to the bottom.
      .sort((a, b) => (Number(b.final_pct) || 0) - (Number(a.final_pct) || 0));

    scored.forEach((entry, index) => {
      rows.push({
        classLabel: labelById.get(cls.id) ?? '',
        num: entry.num,
        rider: entry.rider,
        horse: entry.horse,
        finalPct: entry.final_pct,
        place: index + 1,
      });
    });
  }

  return rows;
}
