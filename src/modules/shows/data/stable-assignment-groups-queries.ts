import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { normalizeStableChart } from '@/modules/shows/data/stable-chart-queries';
import { normalizeTrainerKey } from '@/modules/shows/utils/normalize-trainer-name';

export interface StableAssignmentGroup {
  trainerKey: string;
  trainerName: string;
  horseStallsNeeded: number;
  tackStallsNeeded: number;
  stableWith: string | null;
  candidateHorseKeys: string[];
  horsesPlacedCount: number;
  horsesTotalCount: number;
}

/* Groups horses that share a trainer (falling back to stable) into one
 * stabling block, sized by what was actually purchased (stabling_requests),
 * not just by how many horses share that name — a barn that entered 8
 * horses but only paid for 6 stalls should only ever get 6 placed by Auto
 * Assign. Re-derived server-side on every read (never trusted from the
 * client) so Auto Assign and the Stabling Groups sidebar always agree. */
export async function getStableAssignmentGroups(showId: string): Promise<StableAssignmentGroup[]> {
  const supabase = await createServerClient();

  const [horsesData, requestsResult, showResult] = await Promise.all([
    getHorsesPageData(showId),
    supabase
      .from('stabling_requests')
      .select('trainer_name, horse_stalls, tack_stalls, stable_with')
      .eq('show_id', showId),
    supabase.from('shows').select('stable_chart').eq('id', showId).maybeSingle(),
  ]);
  if (requestsResult.error) throw requestsResult.error;
  if (showResult.error) throw showResult.error;
  if (!horsesData) return [];

  const chart = normalizeStableChart(showResult.data?.stable_chart);
  const assignedHorseKeys = new Set<string>();
  for (const stable of chart.stables) {
    for (const stall of stable.stalls) {
      if (stall.horseId) assignedHorseKeys.add(stall.horseId);
    }
  }

  interface Agg {
    trainerName: string;
    horseStallsNeeded: number;
    tackStallsNeeded: number;
    stableWith: string | null;
  }
  const byKey = new Map<string, Agg>();
  for (const r of requestsResult.data) {
    const key = normalizeTrainerKey(r.trainer_name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.horseStallsNeeded += r.horse_stalls;
      existing.tackStallsNeeded += r.tack_stalls;
      existing.stableWith ??= r.stable_with;
    } else {
      byKey.set(key, {
        trainerName: r.trainer_name.trim(),
        horseStallsNeeded: r.horse_stalls,
        tackStallsNeeded: r.tack_stalls,
        stableWith: r.stable_with,
      });
    }
  }

  const horsesByKey = new Map<string, string[]>();
  for (const row of horsesData.rows) {
    const key = normalizeTrainerKey(row.trainer, row.stable);
    if (!key) continue;
    const list = horsesByKey.get(key) ?? [];
    list.push(row.key);
    horsesByKey.set(key, list);
  }

  return [...byKey.entries()].map(([trainerKey, agg]) => {
    const candidateHorseKeys = horsesByKey.get(trainerKey) ?? [];
    const horsesPlacedCount = candidateHorseKeys.filter((k) => assignedHorseKeys.has(k)).length;
    return {
      trainerKey,
      trainerName: agg.trainerName,
      horseStallsNeeded: agg.horseStallsNeeded,
      tackStallsNeeded: agg.tackStallsNeeded,
      stableWith: agg.stableWith,
      candidateHorseKeys,
      horsesPlacedCount,
      horsesTotalCount: candidateHorseKeys.length,
    };
  });
}
