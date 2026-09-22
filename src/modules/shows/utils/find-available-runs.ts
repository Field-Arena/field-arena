import type { StableChartStall } from '@/modules/shows/data/stable-chart-queries';

export interface StallRun {
  startIndex: number;
  length: number;
}

// Maximal runs of array-adjacent `available` stalls, in stall order — the
// same left-to-right order the chart displays them in (splitStallsIntoRows
// chunks this same order into rows), so a "contiguous block" here matches
// what a secretary sees as physically contiguous on screen.
export function findAvailableRuns(stalls: StableChartStall[]): StallRun[] {
  const runs: StallRun[] = [];
  let start: number | null = null;
  for (let i = 0; i <= stalls.length; i++) {
    const isAvailable = i < stalls.length && stalls[i]?.status === 'available';
    if (isAvailable && start === null) start = i;
    if (!isAvailable && start !== null) {
      runs.push({ startIndex: start, length: i - start });
      start = null;
    }
  }
  return runs;
}
