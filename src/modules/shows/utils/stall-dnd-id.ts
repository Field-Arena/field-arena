import type {
  StableChartStable,
  StableChartStall,
} from '@/modules/shows/data/stable-chart-queries';

// dnd-kit needs one flat, unique id per draggable/droppable — a stall's own
// id isn't guaranteed unique across stables in isolation from its parent, so
// this encodes both.
const SEPARATOR = '::';

export function buildStallDndId(stableId: string, stallId: string): string {
  return `${stableId}${SEPARATOR}${stallId}`;
}

export function parseStallDndId(id: string): { stableId: string; stallId: string } | null {
  const idx = id.indexOf(SEPARATOR);
  if (idx === -1) return null;
  return { stableId: id.slice(0, idx), stallId: id.slice(idx + SEPARATOR.length) };
}

export function findStallById(
  stables: StableChartStable[],
  stableId: string,
  stallId: string,
): StableChartStall | null {
  const stable = stables.find((s) => s.id === stableId);
  return stable?.stalls.find((st) => st.id === stallId) ?? null;
}

// Distinct prefixes so a single DndContext can tell a dragged stabling
// group apart from a dragged stall, and a stable's drop container apart
// from one of its own stalls, purely from the string id.
const GROUP_PREFIX = 'group::';
const STABLE_DROP_PREFIX = 'stable-drop::';

export function buildGroupDndId(trainerKey: string): string {
  return `${GROUP_PREFIX}${trainerKey}`;
}

export function parseGroupDndId(id: string): string | null {
  return id.startsWith(GROUP_PREFIX) ? id.slice(GROUP_PREFIX.length) : null;
}

export function buildStableDropId(stableId: string): string {
  return `${STABLE_DROP_PREFIX}${stableId}`;
}

export function parseStableDropId(id: string): string | null {
  return id.startsWith(STABLE_DROP_PREFIX) ? id.slice(STABLE_DROP_PREFIX.length) : null;
}
