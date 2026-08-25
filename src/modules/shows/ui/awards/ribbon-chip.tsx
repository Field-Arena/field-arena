import { cn } from '@/shared/lib/utils';

export function RibbonChip({
  place,
  fill,
  numFg,
  name,
  count,
}: {
  place: string;
  fill: string;
  numFg: string;
  name: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-[9px] rounded-full border border-[#E9EDEB] bg-white py-[5px] pr-[13px] pl-[5px]">
      <span
        className={cn(
          'grid size-6 place-items-center rounded-full text-[11.5px] font-bold',
          fill === '#FFFFFF' ? 'border border-[#BCC6C1]' : '',
        )}
        style={{ background: fill, color: numFg }}
      >
        {place}
      </span>
      <span className="text-[13px] font-semibold text-[#16261F]">{name}</span>
      <span className="text-[12.5px] text-[#98A29D]">×{count}</span>
    </span>
  );
}
