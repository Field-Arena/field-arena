'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { parseInput } from '@/shared/lib/action-result';
import type { Json } from '@/shared/types/database.types';
import {
  setStableCountSchema,
  updateStableFieldSchema,
  generateStableStallsSchema,
  renameStallSchema,
  setStallStatusSchema,
  unassignStallSchema,
  updateStallNoteSchema,
  reassignStallSchema,
  swapStallsSchema,
  assignGroupToStableSchema,
  toggleStableChartStatusSchema,
  autoAssignStableStallsSchema,
  applySavedLocationStablesSchema,
} from '@/modules/shows/schemas';
import { resizeStableStalls } from '@/modules/shows/utils/resize-stable-stalls';
import { findAvailableRuns } from '@/modules/shows/utils/find-available-runs';
import { normalizeTrainerKey } from '@/modules/shows/utils/normalize-trainer-name';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import {
  getStableAssignmentGroups,
  type StableAssignmentGroup,
} from '@/modules/shows/data/stable-assignment-groups-queries';
import {
  normalizeStableChart,
  type StableChart,
  type StableChartStable,
  type StableChartStall,
} from '@/modules/shows/data/stable-chart-queries';
import { HORSES_PATH, STABLE_CHART_PATH } from '@/modules/shows/constants';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

function revalidateStableChart() {
  revalidatePath(STABLE_CHART_PATH);
  revalidatePath(HORSES_PATH);
}

async function readChart(supabase: SupabaseClient, showId: string): Promise<StableChart> {
  const { data, error } = await supabase
    .from('shows')
    .select('stable_chart')
    .eq('id', showId)
    .single();
  if (error) throw new Error(error.message);
  return normalizeStableChart(data.stable_chart);
}

async function writeChart(
  supabase: SupabaseClient,
  showId: string,
  chart: StableChart,
): Promise<void> {
  const { error } = await supabase
    .from('shows')
    .update({ stable_chart: chart as unknown as Json })
    .eq('id', showId);
  if (error) throw new Error(error.message);
  revalidateStableChart();
}

export async function setStableCount(input: unknown): Promise<void> {
  const parsed = parseInput(setStableCountSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.slice(0, parsed.count);
  while (stables.length < parsed.count) {
    stables.push({
      id: crypto.randomUUID(),
      name: `Stable ${String(stables.length + 1)}`,
      stallCount: 0,
      rowCount: 1,
      stalls: [],
    });
  }

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function updateStableField(input: unknown): Promise<void> {
  const parsed = parseInput(updateStableFieldSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id === parsed.stableId
      ? {
          ...s,
          ...(parsed.name !== undefined ? { name: parsed.name } : {}),
          ...(parsed.stallCount !== undefined ? { stallCount: parsed.stallCount } : {}),
          ...(parsed.rowCount !== undefined ? { rowCount: parsed.rowCount } : {}),
        }
      : s,
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function generateStableStalls(input: unknown): Promise<void> {
  const parsed = parseInput(generateStableStallsSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable => {
    if (s.id !== parsed.stableId) return s;
    const stallCount = parsed.stallCount ?? s.stallCount;
    return { ...s, stallCount, stalls: resizeStableStalls(s.stalls, stallCount) };
  });

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function renameStall(input: unknown): Promise<void> {
  const parsed = parseInput(renameStallSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : {
          ...s,
          stalls: s.stalls.map((st) =>
            st.id === parsed.stallId ? { ...st, label: parsed.label } : st,
          ),
        },
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function setStallStatus(input: unknown): Promise<void> {
  const parsed = parseInput(setStallStatusSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : {
          ...s,
          stalls: s.stalls.map((st): StableChartStall => {
            if (st.id !== parsed.stallId) return st;
            const clearingHorse = parsed.status !== 'available' && st.status === 'occupied';
            return {
              ...st,
              status: parsed.status,
              statusReason: parsed.reason ?? null,
              ...(clearingHorse
                ? {
                    horseId: null,
                    horseName: null,
                    riderName: null,
                    trainerName: null,
                    shavings: 0,
                    isStallion: false,
                  }
                : {}),
            };
          }),
        },
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function unassignStall(input: unknown): Promise<void> {
  const parsed = parseInput(unassignStallSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : {
          ...s,
          stalls: s.stalls.map((st): StableChartStall =>
            st.id !== parsed.stallId
              ? st
              : {
                  ...st,
                  status: 'available',
                  horseId: null,
                  horseName: null,
                  riderName: null,
                  trainerName: null,
                  shavings: 0,
                  isStallion: false,
                },
          ),
        },
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function updateStallNote(input: unknown): Promise<void> {
  const parsed = parseInput(updateStallNoteSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : {
          ...s,
          stalls: s.stalls.map((st): StableChartStall =>
            st.id !== parsed.stallId ? st : { ...st, note: parsed.note },
          ),
        },
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function reassignStall(input: unknown): Promise<void> {
  const parsed = parseInput(reassignStallSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s) => ({ ...s, stalls: s.stalls.map((st) => ({ ...st })) }));
  const fromStall = stables
    .find((s) => s.id === parsed.fromStableId)
    ?.stalls.find((st) => st.id === parsed.fromStallId);
  const toStall = stables
    .find((s) => s.id === parsed.toStableId)
    ?.stalls.find((st) => st.id === parsed.toStallId);
  if (!fromStall || !toStall) throw new Error('Stall not found.');
  // Re-validated here regardless of what the UI already checked — never
  // trust the client on "is this stall actually available."
  if (toStall.status !== 'available') throw new Error('That stall is not available.');

  toStall.horseId = fromStall.horseId;
  toStall.horseName = fromStall.horseName;
  toStall.riderName = fromStall.riderName;
  toStall.trainerName = fromStall.trainerName;
  toStall.isStallion = fromStall.isStallion;
  toStall.shavings = fromStall.shavings;
  toStall.status = 'occupied';
  toStall.statusReason = null;

  fromStall.horseId = null;
  fromStall.horseName = null;
  fromStall.riderName = null;
  fromStall.trainerName = null;
  fromStall.isStallion = false;
  fromStall.shavings = 0;
  fromStall.status = 'available';

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function swapStalls(input: unknown): Promise<void> {
  const parsed = parseInput(swapStallsSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s) => ({ ...s, stalls: s.stalls.map((st) => ({ ...st })) }));
  const stallA = stables
    .find((s) => s.id === parsed.stableAId)
    ?.stalls.find((st) => st.id === parsed.stallAId);
  const stallB = stables
    .find((s) => s.id === parsed.stableBId)
    ?.stalls.find((st) => st.id === parsed.stallBId);
  if (!stallA || !stallB) throw new Error('Stall not found.');
  if (stallA.status !== 'occupied' || stallB.status !== 'occupied') {
    throw new Error('Both stalls must be occupied to swap.');
  }

  const a = {
    horseId: stallA.horseId,
    horseName: stallA.horseName,
    riderName: stallA.riderName,
    trainerName: stallA.trainerName,
    isStallion: stallA.isStallion,
    shavings: stallA.shavings,
  };

  stallA.horseId = stallB.horseId;
  stallA.horseName = stallB.horseName;
  stallA.riderName = stallB.riderName;
  stallA.trainerName = stallB.trainerName;
  stallA.isStallion = stallB.isStallion;
  stallA.shavings = stallB.shavings;

  stallB.horseId = a.horseId;
  stallB.horseName = a.horseName;
  stallB.riderName = a.riderName;
  stallB.trainerName = a.trainerName;
  stallB.isStallion = a.isStallion;
  stallB.shavings = a.shavings;

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function toggleStableChartStatus(input: unknown): Promise<void> {
  const parsed = parseInput(toggleStableChartStatusSchema, input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  await writeChart(supabase, parsed.showId, {
    ...chart,
    status: chart.status === 'published' ? 'draft' : 'published',
  });
}

interface StallRef {
  stableIndex: number;
  startIndex: number;
  length: number;
}

/* Places one stabling group into the given runs (already sized to exactly
 * what the group needs): the first horseStallsNeeded slots get horses (in
 * run order, so the block stays visually contiguous), the trailing
 * tackStallsNeeded slots become tack stalls. A purchased-but-unmatched horse
 * slot goes to 'hold' rather than staying 'available' — leaving it available
 * would let a later group's pass (or a follow-up manual assign) hand a stall
 * this trainer already paid for to someone else. */
function placeGroup(
  nextStables: StableChartStable[],
  group: StableAssignmentGroup,
  runs: StallRef[],
  horseByKey: Map<string, { horseName: string; riderName: string | null; isStallion: boolean }>,
  assignedKeys: Set<string>,
): void {
  const slots: { stableIndex: number; stallIndex: number }[] = [];
  for (const run of runs) {
    for (let i = 0; i < run.length; i++) {
      slots.push({ stableIndex: run.stableIndex, stallIndex: run.startIndex + i });
    }
  }

  const horseSlots = slots.slice(0, group.horseStallsNeeded);
  const tackSlots = slots.slice(
    group.horseStallsNeeded,
    group.horseStallsNeeded + group.tackStallsNeeded,
  );

  // Weak stallion-adjacency heuristic, scoped within this group only:
  // cluster stallions at one end of the block rather than interleaving them.
  const candidates = group.candidateHorseKeys
    .filter((key) => !assignedKeys.has(key))
    .sort((a, b) => {
      const aStallion = horseByKey.get(a)?.isStallion ? 1 : 0;
      const bStallion = horseByKey.get(b)?.isStallion ? 1 : 0;
      return aStallion - bStallion;
    });

  horseSlots.forEach((slot, i) => {
    const stall = nextStables[slot.stableIndex]?.stalls[slot.stallIndex];
    if (!stall) return;
    const horseKey = candidates[i];
    if (horseKey) {
      const h = horseByKey.get(horseKey);
      stall.horseId = horseKey;
      stall.horseName = h?.horseName ?? null;
      stall.riderName = h?.riderName ?? null;
      stall.trainerName = group.trainerName;
      stall.isStallion = h?.isStallion ?? false;
      stall.status = 'occupied';
      stall.statusReason = null;
      assignedKeys.add(horseKey);
    } else {
      stall.status = 'hold';
      stall.statusReason = `Reserved for ${group.trainerName} — no horse assigned yet`;
      stall.trainerName = group.trainerName;
    }
  });

  tackSlots.forEach((slot) => {
    const stall = nextStables[slot.stableIndex]?.stalls[slot.stallIndex];
    if (!stall) return;
    stall.status = 'tack';
    stall.trainerName = group.trainerName;
    stall.statusReason = null;
  });
}

export async function autoAssignStableStalls(input: unknown): Promise<void> {
  const parsed = parseInput(autoAssignStableStallsSchema, input);
  const supabase = await createServerClient();

  const [chart, horsesData, groups] = await Promise.all([
    readChart(supabase, parsed.showId),
    getHorsesPageData(parsed.showId),
    getStableAssignmentGroups(parsed.showId),
  ]);
  if (!horsesData) throw new Error('Show not found.');

  const horseByKey = new Map(
    horsesData.rows.map((r) => [
      r.key,
      {
        horseName: r.horseName,
        riderName: r.riderLabel === '—' ? null : r.riderLabel,
        isStallion: r.isStallion,
      },
    ]),
  );

  const nextStables = chart.stables.map((s) => ({
    ...s,
    stalls: s.stalls.map((st) => ({ ...st })),
  }));

  const assignedKeys = new Set<string>();
  for (const stable of nextStables) {
    for (const st of stable.stalls) {
      if (st.horseId) assignedKeys.add(st.horseId);
    }
  }

  // Largest barns first (greedy) — gives the biggest, hardest-to-place
  // groups first pick of contiguous space.
  const sortedGroups = groups
    .filter((g) => g.horseStallsNeeded + g.tackStallsNeeded > 0)
    .sort(
      (a, b) =>
        b.horseStallsNeeded + b.tackStallsNeeded - (a.horseStallsNeeded + a.tackStallsNeeded),
    );

  const placedRuns = new Map<string, StallRef[]>();

  for (const group of sortedGroups) {
    const needed = group.horseStallsNeeded + group.tackStallsNeeded;
    const stableWithKey = group.stableWith ? normalizeTrainerKey(group.stableWith) : null;

    let chosen: StallRef[] | null = null;

    // 1. Prefer a run touching an already-placed "stable with" block, in
    // the same stable — trimmed from whichever end actually touches, so the
    // new block lands flush against the placed one rather than just
    // somewhere inside the same (possibly much larger) run.
    if (stableWithKey) {
      let best: StallRef | null = null;
      for (const placed of placedRuns.get(stableWithKey) ?? []) {
        const stable = nextStables[placed.stableIndex];
        if (!stable) continue;
        for (const run of findAvailableRuns(stable.stalls)) {
          if (run.length < needed) continue;
          const touchesAfter = placed.startIndex + placed.length === run.startIndex;
          const touchesBefore = run.startIndex + run.length === placed.startIndex;
          if (!touchesAfter && !touchesBefore) continue;
          const startIndex = touchesAfter ? run.startIndex : run.startIndex + run.length - needed;
          if (!best || run.length < best.length) {
            best = { stableIndex: placed.stableIndex, startIndex, length: run.length };
          }
        }
      }
      if (best)
        chosen = [{ stableIndex: best.stableIndex, startIndex: best.startIndex, length: needed }];
    }

    // 2. Best-fit: the smallest sufficient run, any stable.
    if (!chosen) {
      const sufficientRuns: StallRef[] = [];
      nextStables.forEach((stable, stableIndex) => {
        for (const run of findAvailableRuns(stable.stalls)) {
          if (run.length >= needed) {
            sufficientRuns.push({ stableIndex, startIndex: run.startIndex, length: run.length });
          }
        }
      });
      const best = sufficientRuns.reduce<StallRef | null>(
        (acc, run) => (!acc || run.length < acc.length ? run : acc),
        null,
      );
      if (best)
        chosen = [{ stableIndex: best.stableIndex, startIndex: best.startIndex, length: needed }];
    }

    // 3. Fallback: fragment across the largest available runs until the
    // need is exhausted (or availability runs out).
    if (!chosen) {
      const allRuns: StallRef[] = [];
      nextStables.forEach((stable, stableIndex) => {
        for (const run of findAvailableRuns(stable.stalls)) {
          allRuns.push({ stableIndex, ...run });
        }
      });
      allRuns.sort((a, b) => b.length - a.length);

      let remaining = needed;
      const fragments: StallRef[] = [];
      for (const run of allRuns) {
        if (remaining <= 0) break;
        const take = Math.min(run.length, remaining);
        fragments.push({ ...run, length: take });
        remaining -= take;
      }
      if (fragments.length) chosen = fragments;
    }

    if (!chosen) continue;

    placeGroup(nextStables, group, chosen, horseByKey, assignedKeys);
    placedRuns.set(group.trainerKey, [...(placedRuns.get(group.trainerKey) ?? []), ...chosen]);
  }

  await writeChart(supabase, parsed.showId, { ...chart, stables: nextStables });
}

// The manual "drop this whole barn's block here" entry point — re-derives
// the one group server-side (never trusts the client's counts) and runs the
// same placeGroup() logic from autoAssignStableStalls, scoped to a single
// target stable instead of scanning the whole chart.
export async function assignGroupToStable(input: unknown): Promise<void> {
  const parsed = parseInput(assignGroupToStableSchema, input);
  const supabase = await createServerClient();

  const [chart, horsesData, groups] = await Promise.all([
    readChart(supabase, parsed.showId),
    getHorsesPageData(parsed.showId),
    getStableAssignmentGroups(parsed.showId),
  ]);
  if (!horsesData) throw new Error('Show not found.');

  const group = groups.find((g) => g.trainerKey === parsed.trainerKey);
  if (!group) throw new Error('Stabling group not found.');
  const needed = group.horseStallsNeeded + group.tackStallsNeeded;
  if (needed <= 0) throw new Error('This group has no stalls to place.');

  const horseByKey = new Map(
    horsesData.rows.map((r) => [
      r.key,
      {
        horseName: r.horseName,
        riderName: r.riderLabel === '—' ? null : r.riderLabel,
        isStallion: r.isStallion,
      },
    ]),
  );

  const nextStables = chart.stables.map((s) => ({
    ...s,
    stalls: s.stalls.map((st) => ({ ...st })),
  }));
  const assignedKeys = new Set<string>();
  for (const stable of nextStables) {
    for (const st of stable.stalls) {
      if (st.horseId) assignedKeys.add(st.horseId);
    }
  }

  const targetIndex = nextStables.findIndex((s) => s.id === parsed.targetStableId);
  const targetStable = nextStables[targetIndex];
  if (!targetStable) throw new Error('Stable not found.');

  const runs = findAvailableRuns(targetStable.stalls);
  let chosen: StallRef | null = null;

  if (parsed.targetStartStallId) {
    const startIdx = targetStable.stalls.findIndex((st) => st.id === parsed.targetStartStallId);
    const containing =
      startIdx === -1
        ? undefined
        : runs.find((r) => startIdx >= r.startIndex && startIdx < r.startIndex + r.length);
    if (containing && containing.startIndex + containing.length - startIdx >= needed) {
      chosen = { stableIndex: targetIndex, startIndex: startIdx, length: needed };
    }
  }

  if (!chosen) {
    const sufficientRuns = runs.filter((r) => r.length >= needed);
    const best = sufficientRuns.reduce<(typeof sufficientRuns)[number] | null>(
      (acc, r) => (!acc || r.length < acc.length ? r : acc),
      null,
    );
    if (best) chosen = { stableIndex: targetIndex, startIndex: best.startIndex, length: needed };
  }

  if (!chosen) {
    throw new Error("This stable doesn't have enough contiguous available stalls for this group.");
  }

  placeGroup(nextStables, group, [chosen], horseByKey, assignedKeys);

  await writeChart(supabase, parsed.showId, { ...chart, stables: nextStables });
}

interface SavedVenueStall {
  number?: number;
  label?: string;
  closed?: boolean;
}
interface SavedVenueStable {
  name?: string;
  stallCount?: number;
  rowCount?: number;
  stalls?: SavedVenueStall[];
}

export async function applySavedLocationStables(input: unknown): Promise<void> {
  const parsed = parseInput(applySavedLocationStablesSchema, input);

  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');
  if (!profile.org_id) throw new Error('Your account is not the owner of an organization.');

  const supabase = await createServerClient();
  // Any organization's venue, not just the caller's own -- see
  // 20260924120000_shared_venues.sql.
  const [chart, venueResult] = await Promise.all([
    readChart(supabase, parsed.showId),
    supabase.from('venues').select('id, name, stables').eq('id', parsed.venueId).maybeSingle(),
  ]);
  if (venueResult.error) throw new Error(venueResult.error.message);
  const venue = venueResult.data;
  if (!venue) throw new Error('Saved location not found.');

  const venueStables = (venue.stables ?? []) as unknown as SavedVenueStable[];
  if (!venueStables.length) throw new Error('This saved location has no stables to add.');

  const added: StableChartStable[] = venueStables.map((vs) => {
    const realStalls = vs.stalls ?? [];
    const stalls: StableChartStall[] = realStalls.length
      ? realStalls.map((st, i) => ({
          id: crypto.randomUUID(),
          number: st.number ?? i + 1,
          label: st.label ?? String(i + 1),
          horseId: null,
          horseName: null,
          riderName: null,
          trainerName: null,
          shavings: 0,
          status: st.closed ? ('unusable' as const) : ('available' as const),
          statusReason: null,
          note: null,
          isStallion: false,
        }))
      : resizeStableStalls([], vs.stallCount ?? 0);

    return {
      id: crypto.randomUUID(),
      name: vs.name ?? 'Stable',
      stallCount: stalls.length,
      rowCount: vs.rowCount ?? 1,
      stalls,
    };
  });

  await writeChart(supabase, parsed.showId, { ...chart, stables: [...chart.stables, ...added] });
}
