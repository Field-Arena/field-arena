export function TestCountChip({ name, count }: { name: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-[9px] rounded-full border border-[#E9EDEB] bg-white py-[5px] pr-[13px] pl-[10px]">
      <span className="text-[13px] font-semibold text-[#16261F]">{name}</span>
      <span className="text-[12.5px] text-[#98A29D]">×{count}</span>
    </span>
  );
}
