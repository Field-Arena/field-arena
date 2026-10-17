'use client';

import { useDroppable } from '@dnd-kit/core';
import { CardTitle, FaCard } from '@/shared/ui/organizer/fa-page';
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
    <div
      ref={setNodeRef}
      className={`mb-4 rounded-[16px] print:hidden ${
        isOver ? 'outline-2 outline-offset-2 outline-[#1A5B3C] outline-dashed' : ''
      }`}
    >
      <FaCard>
        <CardTitle className="mb-3 text-[17px]">
          {stable.name}{' '}
          <span className="text-[13px] font-semibold text-[#5A6B63]">
            · {stable.stalls.length} stalls
          </span>
        </CardTitle>
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
      </FaCard>
    </div>
  );
}
