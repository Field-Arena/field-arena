export function TestCountChip({ name, count }: { name: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-[9px] rounded-full border border-[#E7EAEE] bg-white py-[5px] pr-[13px] pl-[10px]">
      <span className="text-[13px] font-semibold text-[#101828]">{name}</span>
      <span className="text-[12.5px] text-[#8A94A3]">×{count}</span>
    </span>
  );
}
