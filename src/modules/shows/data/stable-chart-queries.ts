import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { getStableAssignmentGroups } from '@/modules/shows/data/stable-assignment-groups-queries';
import { STALL_STATUSES } from '@/modules/shows/constants';
import type {
  SavedLocationOption,
  StableChart,
  StableChartHorseRow,
  StableChartPageData,
  StableChartStable,
  StableChartStall,
  StableChartSummary,
  StallStatus,
} from '@/modules/shows/types';

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
    getHorsesPageData(showId, { includeUrls: false }),
    getStableAssignmentGroups(showId),
  ]);
  if (showResult.error) throw showResult.error;
  if (!showResult.data || !horsesData) return null;
  const show = showResult.data;

  // Any organization's venue, not just this show's own -- see
  // 20260924120000_shared_venues.sql.
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, stables')
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
