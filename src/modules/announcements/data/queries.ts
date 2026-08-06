import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';

/**
 * Announcer reads, ported from announcer.html: active rings, what is up next,
 * live results, who else is staffed on the show, and the show's document
 * library.
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
  /**
   * Whoever is actually in the ring right now — `scoring_pos` is the same
   * index the scoring screen itself treats as `currentEntry` (see
   * `modules/scoring/ui/scoring-screen.tsx`), not the rider after them. An
   * earlier version of this field was named `nextUp` and the announcing page
   * labeled it "Up next," which told an announcer the wrong rider was up —
   * the one actually still riding.
   */
  current: RingEntrySummary | null;
  /** The next few riders after `current`, ported from announcer.html's "Up Next" queue. */
  upNext: RingEntrySummary[];
}

/** How many riders to show in the "Up Next" queue per ring, matching announcer.html's board depth. */
const UP_NEXT_DEPTH = 3;

/**
 * Ring status: which classes are live, who's actually riding, and who's next.
 *
 * `scoring_pos` is the class's own cursor into its ride order, so `current`/
 * `upNext` are derived from it rather than from whichever entry happens to be
 * unscored — a scratched or worked-in rider would make that wrong.
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

/**
 * Every scored ride, class by class — ported from announcer.html's real-mode
 * Results-Live feed, which read straight off each entry's own `status`/
 * `final_pct` the moment a ride was confirmed, with no dependency on
 * `classes.results_published` at all. An earlier version of this function
 * gated on `results_published`, which meant an announcer saw nothing here
 * for an entire class still in progress — the opposite of "live." A rider's
 * own confirmed score is what an announcer reads out; the organizer's
 * later, separate "Publish" action is about opening the results up to
 * riders/the public, a different audience with a different bar.
 */
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

export interface ShowContact {
  staffId: string;
  name: string;
  role: string;
  phone: string | null;
}

// The roles ported from announcer.html's `contacts` array (Judge, Scribe,
// "Show Secretary") — 'Show Admin' is this schema's equivalent of a show
// secretary. ShowStaff/Vendor aren't people an announcer needs to reach
// mid-ring the way a judge, scribe, or show admin are.
const CONTACT_ROLES = ['Judge', 'Scribe', 'Show Admin'];

/**
 * Who else is staffed on this show — the Contacts tab from announcer.html,
 * which listed judges, scribes, and the show secretary. Every row on this
 * show with a contact-relevant role, not scoped to any one class: an
 * announcer may need to reach any judge/scribe on the show, not just
 * whoever's ring they're currently covering.
 */
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
  /** Signed for a private bucket read, resolved here so the page never handles storage paths directly. */
  url: string | null;
}

/**
 * The show's document library (rider pronunciation guides, sponsor read
 * copy, PA quick-start sheets, etc.) — announcer.html's Documents section,
 * which embedded these as inline PDF previews. `documents` is a private
 * bucket, so each url is signed at read time rather than trusting a stored
 * public URL that would 403 (same pattern as
 * `modules/shows/data/setup-queries.ts`'s `listShowDocuments` — not reused
 * directly, since a module may not import another module's internals).
 */
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
        const { data: signed } = await supabase.storage.from('documents').createSignedUrl(d.path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return { id: d.id, name: d.name, url };
    })
  );
}
