import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import {
  getStableAssignmentGroups,
  type StableAssignmentGroup,
} from '@/modules/shows/data/stable-assignment-groups-queries';
import { STALL_STATUSES } from '@/modules/shows/constants';

export type StallStatus = (typeof STALL_STATUSES)[number];

export interface StableChartStall {
  id: string;
  number: number;
  label: string;

  horseId: string | null;
  horseName: string | null;
  riderName: string | null;
  trainerName: string | null;
  shavings: number;

  status: StallStatus;
  statusReason: string | null;
  note: string | null;

  isStallion: boolean;
}

export interface StableChartStable {
  id: string;
  name: string;
  stallCount: number;
  rowCount: number;
  stalls: StableChartStall[];
}

export interface StableChart {
  status: 'draft' | 'published';
  stables: StableChartStable[];
}

export interface StableChartHorseRow {
  key: string;
  riderLabel: string;
  horseName: string;
  isStallion: boolean;

  shavings: number;
}

export interface SavedLocationOption {
  id: string;
  name: string;
  stableCount: number;
}

export interface StableChartPageData {
  showId: string;
  showName: string;
  chart: StableChart;
  horseRows: StableChartHorseRow[];
  savedLocations: SavedLocationOption[];
  groups: StableAssignmentGroup[];
}

// Backward-compat: shows saved before the status enum existed only have
// `closed`/`horseId` on each stall. Derive `status` from that old shape when
// it's missing so existing charts keep rendering correctly.
function isStallStatus(value: unknown): value is StallStatus {
  return (STALL_STATUSES as readonly string[]).includes(value as string);
}

function normalizeStall(raw: unknown): StableChartStall {
  const s = (raw ?? {}) as Partial<StableChartStall> & { closed?: unknown };
  const status: StallStatus = isStallStatus(s.status)
    ? s.status
    : s.closed === true
      ? 'unusable'
      : (s.horseId ?? s.horseName)
        ? 'occupied'
        : 'available';

  return {
    id: s.id ?? '',
    number: s.number ?? 0,
    label: s.label ?? '',
    horseId: s.horseId ?? null,
    horseName: s.horseName ?? null,
    riderName: s.riderName ?? null,
    trainerName: s.trainerName ?? null,
    shavings: s.shavings ?? 0,
    status,
    statusReason: s.statusReason ?? null,
    note: s.note ?? null,
    isStallion: s.isStallion ?? false,
  };
}

export function normalizeStableChart(raw: unknown): StableChart {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as {
    status?: unknown;
    stables?: unknown;
  };
  const stables = Array.isArray(obj.stables) ? obj.stables : [];
  return {
    status: obj.status === 'published' ? 'published' : 'draft',
    stables: (stables as unknown[]).map((raw) => {
      const s = (raw ?? {}) as Partial<StableChartStable>;
      return {
        id: s.id ?? '',
        name: s.name ?? '',
        stallCount: s.stallCount ?? 0,
        rowCount: s.rowCount ?? 1,
        stalls: (Array.isArray(s.stalls) ? s.stalls : []).map(normalizeStall),
      };
    }),
  };
}

export interface StableChartSummary {
  total: number;
  occupied: number;
  available: number;
  closed: number;
  reserved: number;
  tack: number;
  hold: number;
}

export function summarizeStableChart(chart: StableChart): StableChartSummary | null {
  const allStalls = chart.stables.flatMap((b) => b.stalls);
  const total = allStalls.length;
  if (!total) return null;
  const countOf = (status: StallStatus) => allStalls.filter((s) => s.status === status).length;
  return {
    total,
    occupied: countOf('occupied'),
    available: countOf('available'),
    closed: countOf('unusable'),
    reserved: countOf('reserved'),
    tack: countOf('tack'),
    hold: countOf('hold'),
  };
}

export async function getStableChartPageData(showId: string): Promise<StableChartPageData | null> {
  const supabase = await createServerClient();

  const [showResult, horsesData, groups] = await Promise.all([
    supabase.from('shows').select('id, name, org_id, stable_chart').eq('id', showId).maybeSingle(),
    getHorsesPageData(showId),
    getStableAssignmentGroups(showId),
  ]);
  if (showResult.error) throw showResult.error;
  if (!showResult.data || !horsesData) return null;
  const show = showResult.data;

  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, stables')
    .eq('org_id', show.org_id)
    .order('name');
  if (venuesError) throw venuesError;

  const savedLocations: SavedLocationOption[] = venues
    .map((v) => ({
      id: v.id,
      name: v.name,
      stableCount: Array.isArray(v.stables) ? v.stables.length : 0,
    }))
    .filter((v) => v.stableCount > 0);

  const horseRows: StableChartHorseRow[] = horsesData.rows.map((r) => ({
    key: r.key,
    riderLabel: r.riderLabel,
    horseName: r.horseName,
    isStallion: r.isStallion,
    shavings: 0,
  }));

  return {
    showId: show.id,
    showName: show.name,
    chart: normalizeStableChart(show.stable_chart),
    horseRows,
    savedLocations,
    groups,
  };
}
