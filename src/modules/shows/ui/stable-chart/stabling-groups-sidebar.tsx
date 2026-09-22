'use client';

import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/shared/ui/organizer/card';
import { fa } from '@/shared/lib/organizer-theme';
import { buildGroupDndId } from '@/modules/shows/utils/stall-dnd-id';
import type { StableAssignmentGroup } from '@/modules/shows/data/stable-assignment-groups-queries';

function GroupRow({ group }: { group: StableAssignmentGroup }) {
  const totalStalls = group.horseStallsNeeded + group.tackStallsNeeded;
  const fullyPlaced = group.horsesPlacedCount >= group.horseStallsNeeded;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: buildGroupDndId(group.trainerKey),
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex cursor-grab items-center justify-between rounded-lg border px-3 py-2 text-[13px] active:cursor-grabbing"
      style={{ borderColor: fa.line, opacity: isDragging ? 0.5 : 1 }}
      title="Drag this group onto a stable to place it as one block"
    >
      <span className="font-semibold">{group.trainerName}</span>
      <span className="text-[12px]" style={{ color: fullyPlaced ? fa.green : fa.goldFg }}>
        {totalStalls} stall{totalStalls === 1 ? '' : 's'} · {group.horsesPlacedCount}/
        {group.horseStallsNeeded} placed
      </span>
    </div>
  );
}

export function StablingGroupsSidebar({ groups }: { groups: StableAssignmentGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <Card className="mb-[18px] p-[18px_20px_20px] print:hidden">
      <div className="mb-2.5 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
        Stabling groups
      </div>
      <p className="mb-2.5 text-[11.5px] text-[#7A8781]">
        Drag a group onto a stable below to place it as one block.
      </p>
      <div className="space-y-1.5">
        {groups.map((group) => (
          <GroupRow key={group.trainerKey} group={group} />
        ))}
      </div>
    </Card>
  );
}
