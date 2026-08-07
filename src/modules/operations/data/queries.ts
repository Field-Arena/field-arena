import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { PERMISSION_KEYS, type PermissionKey } from '@/shared/constants/permissions';
import { resolveOperationsPermissions, withSharedRank } from '../utils';

/**
 * ShowStaff reads, ported from showstaff-ops.html: the Find/Riders/Horses/
 * Stabling/Vendors directories, the ring-by-ring Schedule, and the shared
 * Documents library. Every function here is its own copy against the real
 * schema rather than a re-export of `modules/announcements` or
 * `modules/shows` internals — a module may not reach into another module's
 * internals (see `.claude/rules/folder-structure.md`), and this module owns
 * its own read path the same way `modules/scoring` and `modules/judging` do.
 *
 * ShowStaff is read-only everywhere except Documents, where uploading a PDF
 * is explicitly allowed (see data/mutations.ts) — matching the legacy
 * `/api/shows/:id/[resource].js` gate exactly: GET-only on `roster`/
 * `vendors`, GET+POST on `documents`.
 */

export interface OperationsShow {
  id: string;
  name: string;
  dateLabel: string | null;
}

/** Shows this staff member (any role) is staffed on. */
export async function listMyShows(): Promise<OperationsShow[]> {
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

const ORG_LEVEL_ROLES = new Set(['Organizer', 'Show Admin', 'SuperAdmin']);

/**
 * The signed-in caller's effective permissions for this show — used here to
 * gate the Vendors tab on `canViewMoney`, exactly as the legacy `vendors`
 * resource gated it server-side. Org-level roles hold every permission
 * implicitly (they're never a staff_assignments row at all).
 */
export async function getMyPermissions(showId: string): Promise<Record<PermissionKey, boolean>> {
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
  const { data, error } = await supabase
    .from('staff_assignments')
    .select('role, permissions, can_scratch_skip_dq, can_view_money')
    .eq('show_id', showId)
    .or(`user_id.eq.${profile.id},email.eq.${profile.email}`)
    .maybeSingle();
  if (error) throw error;
  if (!data) return allFalse;

  return resolveOperationsPermissions({
    role: data.role,
    permissions: data.permissions,
    canScratchSkipDq: data.can_scratch_skip_dq,
    canViewMoney: data.can_view_money,
  });
}

interface RawStall {
  label?: string;
  number?: number;
  horseId?: string | null;
  horseName?: string | null;
  riderName?: string | null;
  closed?: boolean;
}
interface RawStable {
  name?: string;
  stalls?: RawStall[];
}
interface RawStableChart {
  status?: string;
  stables?: RawStable[];
}

/**
 * One stall code per horse, from the show's *published* stable chart — the
 * same single source of truth legacy's `stallCode()` used everywhere (Find,
 * Riders, Horses, and Stabling all read off of it). Riders/Horses used to
 * show `horses.stable`, a free-text field a rider types on their own horse
 * profile (see `modules/riders/ui/horse-manager.tsx`) that can disagree with
 * where the organizer actually assigned the horse — this reads the
 * organizer's authoritative chart instead, matching Stabling's own source.
 */
async function getStallCodeByHorseId(showId: string): Promise<Map<string, string>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('stable_chart')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;

  const map = new Map<string, string>();
  const chart = (data?.stable_chart ?? {}) as RawStableChart;
  if (chart.status !== 'published') return map;

  for (const stable of chart.stables ?? []) {
    for (const stall of stable.stalls ?? []) {
      if (stall.closed || !stall.horseId) continue;
      const label = stall.label ?? (stall.number != null ? String(stall.number) : '—');
      const stableName = (stable.name ?? '—').replace(/^Stable /i, '');
      map.set(stall.horseId, `${stableName}-${label}`);
    }
  }
  return map;
}

interface RosterEntry {
  classId: string;
  classLabel: string;
  num: string;
  rider: string | null;
  horse: string | null;
  horseId: string | null;
  trainer: string | null;
  stable: string | null;
}

/**
 * Every non-scratched entry across the show's classes, joined to the horse
 * record for trainer and to the published stable chart for stall code.
 * Shared groundwork for the Riders and Horses directories, which are the
 * same underlying rows grouped two different ways — exactly like
 * showstaff-ops.html's `viewRiders`/`viewHorses`, which both read the same
 * `DB.riders` array.
 */
async function getRosterEntries(showId: string): Promise<RosterEntry[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label, display_name')
    .eq('show_id', showId);
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, horse_id, status')
    .in(
      'class_id',
      classes.map((c) => c.id)
    );
  if (entryError) throw entryError;

  const active = entries.filter((e) => e.status !== 'scratched');
  const horseIds = [...new Set(active.map((e) => e.horse_id).filter((id): id is string => !!id))];

  const trainerByHorseId = new Map<string, string | null>();
  const [stallCodeByHorseId] = await Promise.all([
    getStallCodeByHorseId(showId),
    (async () => {
      if (horseIds.length === 0) return;
      const { data: horses, error: horsesError } = await supabase
        .from('horses')
        .select('id, trainer')
        .in('id', horseIds);
      if (horsesError) throw horsesError;
      for (const h of horses) trainerByHorseId.set(h.id, h.trainer);
    })(),
  ]);

  const classById = new Map(classes.map((c) => [c.id, c]));

  return active.map((e) => {
    const cls = classById.get(e.class_id);
    return {
      classId: e.class_id,
      classLabel: cls?.display_name ?? cls?.label ?? '—',
      num: e.num,
      rider: e.rider,
      horse: e.horse,
      horseId: e.horse_id,
      trainer: e.horse_id ? (trainerByHorseId.get(e.horse_id) ?? null) : null,
      stable: e.horse_id ? (stallCodeByHorseId.get(e.horse_id) ?? null) : null,
    };
  });
}

export interface RiderDirectoryRow {
  num: string;
  name: string;
  horse: string;
  stable: string | null;
  classNames: string[];
}

/** The Riders tab — one row per bib number, ported from viewRiders()/ridersRows(). */
export async function listRidersDirectory(showId: string): Promise<RiderDirectoryRow[]> {
  const rows = await getRosterEntries(showId);
  const byNum = new Map<string, RiderDirectoryRow>();
  for (const r of rows) {
    const existing = byNum.get(r.num);
    if (existing) {
      if (!existing.classNames.includes(r.classLabel)) existing.classNames.push(r.classLabel);
    } else {
      byNum.set(r.num, {
        num: r.num,
        name: r.rider ?? '—',
        horse: r.horse ?? '—',
        stable: r.stable,
        classNames: [r.classLabel],
      });
    }
  }
  return [...byNum.values()].sort((a, b) =>
    a.num.localeCompare(b.num, undefined, { numeric: true })
  );
}

export interface HorseDirectoryRow {
  key: string;
  horseName: string;
  riderName: string;
  trainer: string | null;
  stable: string | null;
}

/** The Horses tab — one row per horse, ported from viewHorses()/horsesRows(). */
export async function listHorsesDirectory(showId: string): Promise<HorseDirectoryRow[]> {
  const rows = await getRosterEntries(showId);
  const byHorse = new Map<string, HorseDirectoryRow>();
  for (const r of rows) {
    const key = r.horseId ?? `name:${r.horse ?? r.num}`;
    if (!byHorse.has(key)) {
      byHorse.set(key, {
        key,
        horseName: r.horse ?? '—',
        riderName: r.rider ?? '—',
        trainer: r.trainer,
        stable: r.stable,
      });
    }
  }
  return [...byHorse.values()].sort((a, b) => a.horseName.localeCompare(b.horseName));
}

export interface StablingStall {
  stable: string;
  label: string;
  horseName: string;
  riderName: string;
  /** The rider's bib number, matched by horseId against the roster — legacy's Stabling tab shows this alongside Nights. */
  num: string | null;
}

export interface StablingData {
  /** shows.stable_chart's own draft/published state. Draft charts are the organizer's working copy — ShowStaff sees the chart once it's published, matching the "who's actually stalled today" purpose of this tab. */
  published: boolean;
  stalls: StablingStall[];
}

/**
 * The Stabling tab — occupied stalls from the show's published stable chart,
 * ported from viewStabling(). Legacy also showed a "Nights" column per stall;
 * this schema has no per-stall/per-horse nights-purchased read path anywhere
 * yet (the closest sibling data, per-horse addon totals, is a documented gap
 * in `modules/shows/data/stable-chart-queries.ts`'s shavings comment) — rather
 * than fabricate that number, it's left off here too.
 */
export async function listStabling(showId: string): Promise<StablingData> {
  const supabase = await createServerClient();
  const [{ data, error }, roster] = await Promise.all([
    supabase.from('shows').select('stable_chart').eq('id', showId).maybeSingle(),
    getRosterEntries(showId),
  ]);
  if (error) throw error;

  const numByHorseId = new Map<string, string>();
  for (const r of roster) {
    if (r.horseId && !numByHorseId.has(r.horseId)) numByHorseId.set(r.horseId, r.num);
  }

  const chart = (data?.stable_chart ?? {}) as RawStableChart;
  if (chart.status !== 'published') return { published: false, stalls: [] };

  const stalls: StablingStall[] = [];
  for (const stable of chart.stables ?? []) {
    for (const stall of stable.stalls ?? []) {
      if (stall.closed) continue;
      if (!stall.horseId && !stall.horseName) continue;
      stalls.push({
        stable: stable.name ?? '—',
        label: stall.label ?? (stall.number != null ? String(stall.number) : '—'),
        horseName: stall.horseName ?? '—',
        riderName: stall.riderName ?? '—',
        num: stall.horseId ? (numByHorseId.get(stall.horseId) ?? null) : null,
      });
    }
  }
  stalls.sort(
    (a, b) =>
      a.stable.localeCompare(b.stable) || a.label.localeCompare(b.label, undefined, { numeric: true })
  );
  return { published: true, stalls };
}

export interface VendorRow {
  id: string;
  name: string;
  status: string;
  productsOffered: string | null;
  contact: string | null;
  contactName: string | null;
  phone: string | null;
  itemCount: number;
}

/**
 * The Vendors tab, ported from viewVendors(). Callers must gate this behind
 * `getMyPermissions(showId).canViewMoney` — the legacy `/api/shows/:id/vendors`
 * resource 403'd a ShowStaff caller without that grant, and this function
 * itself does not re-check it (RLS is the real boundary; the UI layer is
 * where the gate belongs, same as everywhere else in this app).
 */
export async function listVendors(showId: string): Promise<VendorRow[]> {
  const supabase = await createServerClient();

  const { data: bookings, error } = await supabase
    .from('vendor_bookings')
    .select('id, name, status, products_offered, contact, contact_name, phone')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;
  if (bookings.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from('vendor_booking_items')
    .select('booking_id, qty')
    .in(
      'booking_id',
      bookings.map((b) => b.id)
    );
  if (itemsError) throw itemsError;

  const countByBooking = new Map<string, number>();
  for (const it of items) {
    countByBooking.set(it.booking_id, (countByBooking.get(it.booking_id) ?? 0) + (it.qty ?? 1));
  }

  return bookings.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status ?? 'pending',
    productsOffered: b.products_offered,
    contact: b.contact,
    contactName: b.contact_name,
    phone: b.phone,
    itemCount: countByBooking.get(b.id) ?? 0,
  }));
}

export interface ShowDocumentRow {
  id: string;
  name: string;
  /** Signed for a private bucket read, resolved here so the page never handles storage paths directly. */
  url: string | null;
}

/** The Documents tab's list, ported from viewDocuments(). `documents` is a private bucket, same as `modules/announcements`'s copy of this read. */
export async function listShowDocuments(showId: string): Promise<ShowDocumentRow[]> {
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

export interface ScheduleEntry {
  num: string;
  rider: string;
  horse: string;
  draw: number;
  /** Raw text column value — may be 'SCR'/'ELIM', not only a number. Rendered as-is, never suffixed with '%', matching `modules/announcements`'s own ResultRow. */
  finalPctRaw: string | null;
  /** Parsed score, or null for an unscored ride and for non-numeric values (SCR/ELIM) — the latter never enter ranking, ported from showstaff-ops.html's loadRealPastShows(), which excludes them from `pct` the same way. */
  finalPctNum: number | null;
}

export interface ScheduleClass {
  id: string;
  label: string;
  ring: string | null;
  date: string | null;
  time: string | null;
  status: 'upcoming' | 'running' | 'done';
  entryCount: number;
  scoredCount: number;
  /** In ride order — holding-queue entries excluded, matching `getRingStatus`'s "next up" convention. */
  entries: ScheduleEntry[];
  /** Scored entries only, sorted by score, shared-ranked. */
  placings: (ScheduleEntry & { place: number })[];
}

/** The Schedule tab, ported from viewSchedule()/classResultsBlock(). */
export async function listSchedule(showId: string): Promise<ScheduleClass[]> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, label, display_name, arena, location, date, time')
    .eq('show_id', showId)
    .order('date')
    .order('time');
  if (error) throw error;
  if (classes.length === 0) return [];

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, num, rider, horse, final_pct, status, ride_order, draw, holding')
    .in(
      'class_id',
      classes.map((c) => c.id)
    )
    .order('ride_order');
  if (entryError) throw entryError;

  const byClass = new Map<string, typeof entries>();
  for (const e of entries) {
    if (e.status === 'scratched' || e.holding) continue;
    const list = byClass.get(e.class_id) ?? [];
    list.push(e);
    byClass.set(e.class_id, list);
  }

  return classes.map((cls) => {
    const list = byClass.get(cls.id) ?? [];
    const scheduleEntries: ScheduleEntry[] = list.map((e, i) => {
      const raw = e.final_pct;
      const numeric =
        raw != null && raw !== 'SCR' && raw !== 'ELIM' && Number.isFinite(Number(raw))
          ? Number(raw)
          : null;
      return {
        num: e.num,
        rider: e.rider ?? '—',
        horse: e.horse ?? '—',
        draw: e.draw ?? i + 1,
        finalPctRaw: raw,
        finalPctNum: numeric,
      };
    });

    const scoredCount = scheduleEntries.filter((e) => e.finalPctRaw != null).length;
    const status: ScheduleClass['status'] =
      scoredCount === 0 ? 'upcoming' : scoredCount >= scheduleEntries.length ? 'done' : 'running';

    const placings = withSharedRank(
      scheduleEntries
        .filter((e) => e.finalPctNum != null)
        .sort((a, b) => (b.finalPctNum ?? 0) - (a.finalPctNum ?? 0))
    );

    return {
      id: cls.id,
      label: cls.display_name ?? cls.label,
      ring: cls.location ?? cls.arena,
      date: cls.date,
      time: cls.time,
      status,
      entryCount: scheduleEntries.length,
      scoredCount,
      entries: scheduleEntries,
      placings,
    };
  });
}
