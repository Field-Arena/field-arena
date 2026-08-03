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
} from '../schemas';
import { resizeStableStalls } from '../utils';
import { getHorsesPageData } from './horses-queries';
import { normalizeStableChart, type StableChart, type StableChartStable, type StableChartStall } from './stable-chart-queries';

/**
 * Stable Chart writes — every one of these is a read-modify-write on the
 * show's own `stable_chart` jsonb column, scoped by stable/stall *id*
 * (see schemas.ts's doc comment for why that's an id, not legacy's array
 * index). Ported from showstaff.html's setStableCount/updateStableField/
 * generateStableStalls/renameStall/toggleStallClosed/toggleStableChartStatus/
 * autoAssignStableStalls/applySavedLocationStables (~13846-14147).
 *
 * Each function stays granular (one legacy action = one Server Action) rather
 * than a single "save the whole chart" endpoint the client computes and
 * hands back whole — the business logic (position-preserving resize,
 * stallion-adjacency preference, "which venue am I allowed to copy from")
 * stays authoritative here, the same reason every other mutation in this
 * codebase validates a narrow input shape instead of trusting a client-built
 * document.
 */

const HORSES_PATH = '/dashboard/horses';
const STABLE_CHART_PATH = '/dashboard/horses/stable-chart';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

function revalidateStableChart() {
  revalidatePath(STABLE_CHART_PATH);
  revalidatePath(HORSES_PATH); // the Horses screen's own stalls-occupied KPI tile reads the same column
}

async function readChart(supabase: SupabaseClient, showId: string): Promise<StableChart> {
  const { data, error } = await supabase.from('shows').select('stable_chart').eq('id', showId).single();
  if (error) throw new Error(error.message);
  return normalizeStableChart(data.stable_chart);
}

async function writeChart(supabase: SupabaseClient, showId: string, chart: StableChart): Promise<void> {
  const { error } = await supabase
    .from('shows')
    .update({ stable_chart: chart as unknown as Json })
    .eq('id', showId);
  if (error) throw new Error(error.message);
  revalidateStableChart();
}

/** "Number of stables" — mirrors setStableCount (~13850): grows by appending fresh empty stables, shrinks by dropping the trailing ones. Existing stables (and their generated stalls) are untouched by position. */
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

/** Stable name / stall count / row count fields — mirrors updateStableField (~13859). Stall count here is staged only; "Generate stalls" is the separate action that actually resizes the stall array. */
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
      : s
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

/** "Generate stalls" / "Update stalls" — mirrors generateStableStalls (~13870): resizes to the stable's current stallCount, preserving existing stalls by position. */
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

/** Click-a-stall-to-rename — mirrors renameStall (~13885). */
export async function renameStall(input: unknown): Promise<void> {
  const parsed = renameStallSchema.parse(input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  const stables = chart.stables.map((s): StableChartStable =>
    s.id !== parsed.stableId
      ? s
      : { ...s, stalls: s.stalls.map((st) => (st.id === parsed.stallId ? { ...st, label: parsed.label } : st)) }
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

/**
 * Open/Closed toggle — mirrors toggleStallClosed (~13899). Closing always
 * clears the assignment (a stall out of service can't also have a horse in
 * it); the occupied-stall confirmation itself is a client-side decision (the
 * client already has the stall's occupancy in hand) — this action just does
 * the toggle once the caller has decided to proceed.
 */
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
              ? { ...st, closed: true, horseId: null, horseName: null, riderName: null, shavings: 0, isStallion: false }
              : { ...st, closed: false };
          }),
        }
  );

  await writeChart(supabase, parsed.showId, { ...chart, stables });
}

/** "✓ Approve & Publish" / "Unpublish" — mirrors toggleStableChartStatus (~13910). */
export async function toggleStableChartStatus(input: unknown): Promise<void> {
  const parsed = toggleStableChartStatusSchema.parse(input);
  const supabase = await createServerClient();
  const chart = await readChart(supabase, parsed.showId);

  await writeChart(supabase, parsed.showId, {
    ...chart,
    status: chart.status === 'published' ? 'draft' : 'published',
  });
}

/**
 * "Auto-assign horses to empty stalls" — mirrors autoAssignStableStalls
 * (~13966). Fills empty, open stalls in stable/stall order with every horse
 * not already placed anywhere on the chart (tracked by the same identity key
 * every stall's horseId already carries — see StableChartStall's doc
 * comment), preferring not to seat a stallion directly next to a
 * non-stallion or vice versa, but placing the horse anyway rather than
 * leaving a paying rider's horse unstalled when every remaining candidate
 * would conflict with a filled neighbor.
 */
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
    shavings: 0, // see stable-chart-queries.ts's doc comment
  }));

  const assignedKeys = new Set<string>();
  for (const stable of chart.stables) {
    for (const st of stable.stalls) {
      if (st.horseId) assignedKeys.add(st.horseId);
    }
  }
  const unassigned = horseRows.filter((h) => !assignedKeys.has(h.key));

  const nextStables = chart.stables.map((s) => ({ ...s, stalls: s.stalls.map((st) => ({ ...st })) }));

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

/**
 * "Add stables from a saved location" — mirrors applySavedLocationStables
 * (~14124). Appends the venue's stables (a show can combine more than one
 * saved location, or add its own on top). Carries over the venue's own stall
 * labels/closed state as-is where it has real stalls built; only falls back
 * to fresh 1..N-numbered stalls for an older saved venue that only ever had
 * a stallCount, never a real stall array.
 */
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
