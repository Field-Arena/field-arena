import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getHorsesPageData } from './horses-queries';

/**
 * The Stable Chart screen's reads — barns, stalls, who's in them — plus the
 * venue library options for "Add stables from a saved location". Ported
 * from showstaff.html's showStableChart/populateSavedLocationStablesSelect
 * (~14042-14147).
 *
 * The horse roster is deliberately *not* re-derived here. horses-queries.ts's
 * getHorsesPageData already builds exactly the right list — one row per horse
 * from class_entries plus shows.manual_horses, each carrying the same
 * `key` identity (`horseId ?? name:${name}` / `manual:${id}`) legacy's
 * collectHorseRowsForStableChart computes by hand — so this screen's horse
 * list stays identity-consistent with the Horses screen's own list simply by
 * calling the same function, rather than drifting out of sync with a second
 * copy of the same grouping logic.
 *
 * Shavings gap: legacy's collectHorseRowsForStableChart reads
 * `r.addons['Extra shavings (bag)']`, a per-rider quantity from a paid
 * add-on. This schema's equivalent — orders.items[].qty cross-referenced
 * against add_ons.shavings, summed per horseId — has no reusable read path
 * built yet anywhere in this codebase (checked: nothing under
 * modules/shows or modules/riders derives a per-horse shavings total from
 * orders today). Rather than invent that pipeline as a side effect of this
 * screen, every horse's shavings count here defaults to 0 — a real,
 * noted gap, not fabricated data. Stable Chart's own manual "shavings" count
 * per stall (set implicitly by auto-assign, editable nowhere else on this
 * screen either, matching legacy) still works once wired.
 */

export interface StableChartStall {
  id: string;
  number: number;
  label: string;
  /**
   * A real horses.id when one exists; otherwise the same synthetic identity
   * key horses-queries.ts's HorseRow.key uses (`name:${name}` for a
   * roster-only horse, `manual:${id}` for a manually-added one) — mirroring
   * that scheme exactly is what lets auto-assign re-run safely without
   * double-booking a horse that has no real horses row.
   */
  horseId: string | null;
  horseName: string | null;
  riderName: string | null;
  shavings: number;
  closed: boolean;
  /** Carried on the stall (not re-looked-up) so auto-assign's stallion-adjacency preference and the ♂ mark can both read it without a second pass over the horse list. */
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
  /** See this module's doc comment — always 0 today. */
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

/** Fills in defaults for shows.stable_chart's default-`{}` / not-yet-set jsonb value. Exported for stable-chart-mutations.ts's own read-modify-write cycle. */
export function normalizeStableChart(raw: unknown): StableChart {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as { status?: unknown; stables?: unknown };
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

/** Stall counts total/occupied/available/closed — mirrors stableStallsKpiHtml (~14033). Null once no stalls exist yet, so callers (the Horses screen's KPI row) can skip rendering a tile for a show with no chart built. */
export function summarizeStableChart(chart: StableChart): StableChartSummary | null {
  const total = chart.stables.reduce((n, b) => n + b.stalls.length, 0);
  if (!total) return null;
  const occupied = chart.stables.reduce(
    (n, b) => n + b.stalls.filter((s) => !s.closed && !!s.horseId).length,
    0
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
