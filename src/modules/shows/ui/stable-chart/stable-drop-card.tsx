'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/shared/ui/organizer/card';
import { fa } from '@/shared/lib/organizer-theme';
import { splitStallsIntoRows } from '@/modules/shows/utils/split-stalls-into-rows';
import { buildStableDropId } from '@/modules/shows/utils/stall-dnd-id';
import { StallBox } from '@/modules/shows/ui/stable-chart/stall-box';
import type { StableChartStable } from '@/modules/shows/data/stable-chart-queries';

// Wraps one stable's card as a drop target for a whole Stabling Group
// dragged from the sidebar, in addition to the individual StallBoxes inside
// it (each a separate, more specific drop target for single-horse moves).
export function StableDropCard({
  showId,
  stable,
  allStables,
}: {
  showId: string;
  stable: StableChartStable;
  allStables: StableChartStable[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: buildStableDropId(stable.id) });
  const rows = splitStallsIntoRows(stable.stalls, stable.rowCount);

  return (
    <div ref={setNodeRef} className="print:hidden">
      <Card
        className="mb-4 p-[18px_20px_20px]"
        style={isOver ? { outline: `2px dashed ${fa.gold}`, outlineOffset: 2 } : undefined}
      >
        <div className="mb-3 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
          {stable.name} — {stable.stalls.length} stalls
        </div>
        {rows.map((rowStalls, i) => (
          <div key={`${stable.id}-row-${String(i)}`} className="mb-2 flex flex-wrap gap-2">
            {rowStalls.map((stall) => (
              <StallBox
                key={stall.id}
                showId={showId}
                stableId={stable.id}
                stall={stall}
                allStables={allStables}
              />
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
