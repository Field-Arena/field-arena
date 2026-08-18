'use client';

import { truncateHorseName } from '@/modules/shows/utils/truncate-horse-name';
import type { StableChartPageData } from '@/modules/shows/data/stable-chart-queries';

/**
 * A dedicated print view — one page per stable — ported from showstaff.html's
 * printStableChart (~14154). Always in the DOM (`hidden print:block`) rather
 * than rendered into a portal on demand: `window.print()` triggers the
 * browser's own print dialog against whatever's currently in the DOM, so
 * this only has to be visible during that dialog, not before.
 */
export function StableChartPrintView({
  showName,
  chart,
}: {
  showName: string;
  chart: StableChartPageData['chart'];
}) {
  const printable = chart.stables.filter((s) => s.stalls.length > 0);
  if (printable.length === 0) return null;

  return (
    <div className="hidden print:block">
      {printable.map((stable, i) => (
        <div
          key={stable.id}
          className="p-10"
          style={{ pageBreakAfter: i < printable.length - 1 ? 'always' : 'auto' }}
        >
          <h1 className="text-[32px] font-bold">
            {showName} — {stable.name}
          </h1>
          <p className="mb-6 text-base text-[#555]">
            {stable.stalls.length} stalls · printed {new Date().toLocaleDateString()}
          </p>
          <div className="grid grid-cols-4 gap-4">
            {stable.stalls.map((stall) => {
              const occupied = !!(stall.horseId ?? stall.horseName);
              return (
                <div
                  key={stall.id}
                  className="rounded-lg border border-[#CCC] p-3"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <div className="text-[34px] leading-none font-extrabold">{stall.label}</div>
                  {stall.closed ? (
                    <div className="text-lg font-bold text-[#888]">Closed</div>
                  ) : occupied ? (
                    <>
                      <div className="text-xl">{truncateHorseName(stall.riderName ?? '')}</div>
                      <div className="text-[22px] font-bold">
                        {truncateHorseName(stall.horseName ?? '')}
                      </div>
                      <div className="text-base">Shavings owed: {stall.shavings}</div>
                    </>
                  ) : (
                    <div className="text-lg text-[#888]">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
