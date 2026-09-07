'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import type { Json } from '@/shared/types/database.types';
import {
  setStableCountSchema,
  updateStableFieldSchema,
  generateStableStallsSchema,
  renameStallSchema,
  toggleStallClosedSchema,
  toggleStableChartStatusSchema,
  autoAssignStableStallsSchema,
  applySavedLocationStablesSchema,
} from '@/modules/shows/schemas';
import { resizeStableStalls } from '@/modules/shows/utils/resize-stable-stalls';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
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
  const parsed = setStableCountSchema.parse(input);
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
  const parsed = updateStableFieldSchema.parse(input);
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
  const parsed = generateStableStallsSchema.parse(input);
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
  const parsed = renameStallSchema.parse(input);
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

export async function toggleStallClosed(input: unknown): Promise<void> {
  const parsed = toggleStallClosedSchema.parse(input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : {
          ...s,
          stalls: s.stalls.map((st): StableChartStall => {
            if (st.id !== parsed.stallId) return st;
            const closing = !st.closed;
            return closing
              ? {
                  ...st,
                  closed: true,
                  horseId: null,
                  horseName: null,
                  riderName: null,
                  shavings: 0,
                  isStallion: false,
                }
              : { ...st, closed: false };
          }),
        },
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

export async function toggleStableChartStatus(input: unknown): Promise<void> {
  const parsed = toggleStableChartStatusSchema.parse(input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  await writeChart(supabase, parsed.showId, {
    ...chart,
    status: chart.status === 'published' ? 'draft' : 'published',
  });
}

export async function autoAssignStableStalls(input: unknown): Promise<void> {
  const parsed = autoAssignStableStallsSchema.parse(input);
  const supabase = await createServerClient();

  const [chart, horsesData] = await Promise.all([
    readChart(supabase, parsed.showId),
    getHorsesPageData(parsed.showId),
  ]);
  if (!horsesData) throw new Error('Show not found.');

  const horseRows = horsesData.rows.map((r) => ({
    key: r.key,
    horseName: r.horseName,
    riderName: r.riderLabel === '—' ? null : r.riderLabel,
    isStallion: r.isStallion,
    shavings: 0,
  }));

  const assignedKeys = new Set<string>();
  for (const stable of chart.stables) {
    for (const st of stable.stalls) {
      if (st.horseId) assignedKeys.add(st.horseId);
    }
  }
  const unassigned = horseRows.filter((h) => !assignedKeys.has(h.key));

  const nextStables = chart.stables.map((s) => ({
    ...s,
    stalls: s.stalls.map((st) => ({ ...st })),
  }));

  outer: for (const stable of nextStables) {
    const stalls = stable.stalls;
    for (let i = 0; i < stalls.length; i++) {
      const stall = stalls[i];
      if (!stall || stall.horseId || stall.closed) continue;
      if (!unassigned.length) break outer;

      const prev = i > 0 ? stalls[i - 1] : undefined;
      const next = i + 1 < stalls.length ? stalls[i + 1] : undefined;
      const prevFilled = prev?.horseId ? prev.isStallion : null;
      const nextFilled = next?.horseId ? next.isStallion : null;

      let pickIdx = unassigned.findIndex((h) => {
        if (prevFilled != null && h.isStallion !== prevFilled) return false;
        if (nextFilled != null && h.isStallion !== nextFilled) return false;
        return true;
      });
      if (pickIdx === -1) pickIdx = 0;

      const h = unassigned.splice(pickIdx, 1)[0];
      if (!h) continue;

      stall.horseId = h.key;
      stall.horseName = h.horseName;
      stall.riderName = h.riderName;
      stall.shavings = h.shavings;
      stall.isStallion = h.isStallion;
    }
  }

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
  const parsed = applySavedLocationStablesSchema.parse(input);

  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');
  if (!profile.org_id) throw new Error('Your account is not the owner of an organization.');

  const supabase = await createServerClient();
  const [chart, venueResult] = await Promise.all([
    readChart(supabase, parsed.showId),
    supabase
      .from('venues')
      .select('id, name, stables')
      .eq('id', parsed.venueId)
      .eq('org_id', profile.org_id)
      .maybeSingle(),
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
          shavings: 0,
          closed: !!st.closed,
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
