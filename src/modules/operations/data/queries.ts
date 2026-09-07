import 'server-only';
import type { ScheduleClass, ScheduleEntry, PastShowResult } from '@/modules/operations/types';

export type { ScheduleClass, ScheduleEntry };
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { PERMISSION_KEYS, type PermissionKey } from '@/shared/constants/permissions';
import { ORG_LEVEL_ROLES } from '@/modules/operations/constants';
import { resolveOperationsPermissions } from '@/modules/operations/utils/resolve-operations-permissions';
import { withSharedRank } from '@/modules/operations/utils/with-shared-rank';

export interface OperationsShow {
  id: string;
  name: string;
  dateLabel: string | null;
}

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
      classes.map((c) => c.id),
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
    a.num.localeCompare(b.num, undefined, { numeric: true }),
  );
}

export interface HorseDirectoryRow {
  key: string;
  horseName: string;
  riderName: string;
  trainer: string | null;
  stable: string | null;
}

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

  num: string | null;
}

export interface StablingData {
  published: boolean;
  stalls: StablingStall[];
}

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
      a.stable.localeCompare(b.stable) ||
      a.label.localeCompare(b.label, undefined, { numeric: true }),
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
      bookings.map((b) => b.id),
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

  url: string | null;
}

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
        const { data: signed } = await supabase.storage
          .from('documents')
          .createSignedUrl(d.path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return { id: d.id, name: d.name, url };
    }),
  );
}

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
      classes.map((c) => c.id),
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
        .sort((a, b) => (b.finalPctNum ?? 0) - (a.finalPctNum ?? 0)),
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

/* Shows this staff member worked that have already finished, with their final
 * placings — legacy's results archive (showstaff-ops.html:394 loadRealPastShows,
 * selectable from the Results tab's show picker at :1149).
 *
 * Scoped to their OWN assignments, exactly as legacy was: this is "shows I
 * worked", not "every past show on the platform". A show only appears once it
 * has at least one scored ride, matching legacy's
 * `.filter(function(ev){ return ev.entries.length; })` — an unscored past show
 * has nothing to archive. */
export async function listPastShowResults(): Promise<PastShowResult[]> {
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
  const today = new Date().toISOString().slice(0, 10);

  const { data: shows, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label, end_date, start_date')
    .in('id', showIds)
    .lt('end_date', today)
    .order('end_date', { ascending: false });
  if (showError) throw showError;
  if (shows.length === 0) return [];

  const results = await Promise.all(
    shows.map(async (show) => {
      const classes = await listSchedule(show.id);
      const scored = classes.filter((c) => c.placings.length > 0);
      if (scored.length === 0) return null;
      return {
        showId: show.id,
        showName: show.name,
        date: show.date_label ?? show.end_date,
        classes: scored,
      } satisfies PastShowResult;
    }),
  );

  return results.filter((r): r is PastShowResult => r !== null);
}

/* Horses on the grounds TODAY vs entered overall — legacy's Horses KPI showed
 * both as "today / total" (showstaff-ops.html:1189, horsesTodayCount /
 * horsesTotalCount). On a multi-day show the total says how many horses the
 * show has; only the today figure tells the gate how many to expect this
 * morning, which is the number that matters operationally.
 *
 * Counts distinct horse names, as legacy did (`new Set(r.horse)`) — entries
 * carry plain horse text, and one horse ridden in four classes is one horse. */
export async function getHorseCounts(showId: string): Promise<{ today: number; total: number }> {
  const supabase = await createServerClient();

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, date')
    .eq('show_id', showId);
  if (error) throw error;
  if (classes.length === 0) return { today: 0, total: 0 };

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id, horse, status')
    .in(
      'class_id',
      classes.map((c) => c.id),
    );
  if (entryError) throw entryError;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayClassIds = new Set(classes.filter((c) => c.date === todayIso).map((c) => c.id));

  const total = new Set<string>();
  const today = new Set<string>();
  for (const entry of entries) {
    if (entry.status === 'scratched' || !entry.horse) continue;
    total.add(entry.horse);
    if (todayClassIds.has(entry.class_id)) today.add(entry.horse);
  }

  return { today: today.size, total: total.size };
}
