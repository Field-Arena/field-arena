import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';

export interface StableChartStall {
  id: string;
  number: number;
  label: string;

  horseId: string | null;
  horseName: string | null;
  riderName: string | null;
  shavings: number;
  closed: boolean;

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
}

export function normalizeStableChart(raw: unknown): StableChart {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as {
    status?: unknown;
    stables?: unknown;
  };
  return {
    status: obj.status === 'published' ? 'published' : 'draft',
    stables: Array.isArray(obj.stables) ? (obj.stables as StableChartStable[]) : [],
  };
}

export interface StableChartSummary {
  total: number;
  occupied: number;
  available: number;
  closed: number;
}

export function summarizeStableChart(chart: StableChart): StableChartSummary | null {
  const total = chart.stables.reduce((n, b) => n + b.stalls.length, 0);
  if (!total) return null;
  const occupied = chart.stables.reduce(
    (n, b) => n + b.stalls.filter((s) => !s.closed && !!s.horseId).length,
    0,
  );
  const closed = chart.stables.reduce((n, b) => n + b.stalls.filter((s) => s.closed).length, 0);
  return { total, occupied, available: total - occupied - closed, closed };
}

export async function getStableChartPageData(showId: string): Promise<StableChartPageData | null> {
  const supabase = await createServerClient();

  const [showResult, horsesData] = await Promise.all([
    supabase.from('shows').select('id, name, org_id, stable_chart').eq('id', showId).maybeSingle(),
    getHorsesPageData(showId),
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
  };
}
