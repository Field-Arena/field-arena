import type { StableChartStall } from '@/modules/shows/data/stable-chart-queries';

export function resizeStableStalls(
  existing: StableChartStall[],
  count: number,
): StableChartStall[] {
  const n = Math.max(0, Math.floor(count) || 0);
  const stalls: StableChartStall[] = [];
  for (let i = 0; i < n; i++) {
    const number = i + 1;
    const prior = existing[i];
    stalls.push(
      prior
        ? { ...prior, number }
        : {
            id: crypto.randomUUID(),
            number,
            label: String(number),
            horseId: null,
            horseName: null,
            riderName: null,
            shavings: 0,
            closed: false,
            isStallion: false,
          },
    );
  }
  return stalls;
}
