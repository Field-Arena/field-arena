'use client';

import { useDraggable } from '@dnd-kit/core';
import { CardTitle, FA_MUTED, FaCard } from '@/shared/ui/organizer/fa-page';
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
      className="flex cursor-grab items-center justify-between rounded-[10px] border-[1.5px] border-[#C9D3CE] bg-white px-3 py-2 text-[13px] hover:border-[#1A5B3C] active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title="Drag this group onto a stable to place it as one block"
    >
      <span className="font-semibold">{group.trainerName}</span>
      <span
        className={`text-[12px] font-semibold ${fullyPlaced ? 'text-[#1A5B3C]' : 'text-[#8A6D14]'}`}
      >
        {totalStalls} stall{totalStalls === 1 ? '' : 's'} · {group.horsesPlacedCount}/
        {group.horseStallsNeeded} placed
      </span>
    </div>
  );
}

export function StablingGroupsSidebar({ groups }: { groups: StableAssignmentGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <FaCard className="mb-4 print:hidden">
      <CardTitle className="text-[17px]">Stabling groups</CardTitle>
      <p className={`${FA_MUTED} mb-2.5`}>
        Drag a group onto a stable below to place it as one block.
      </p>
      <div className="space-y-1.5">
        {groups.map((group) => (
          <GroupRow key={group.trainerKey} group={group} />
        ))}
      </div>
    </FaCard>
  );
}
