import type { MasterSchedule } from '@/modules/shows/schedule-engine';

export function ClashGroup({
  heading,
  blurb,
  rows,
}: {
  heading: string;
  blurb: string;
  rows: MasterSchedule['conflicts']['avoided'];
}) {
  return (
    <div>
      <div className="text-[12.5px] font-bold text-[#101828]">
        {heading} · {rows.length}
      </div>
      <p className="mb-2 text-[12px] leading-[1.5] text-[#8A94A3]">{blurb}</p>

      <div className="flex flex-col">
        {rows.map((clash, i) => (
          <div
            key={`${clash.riderNum}-${clash.classA}-${clash.classB}-${String(i)}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[#EEF1F4] py-[7px] text-[12.5px] last:border-b-0"
          >
            <span className="font-semibold">#{clash.riderNum}</span>
            <span className="font-semibold">{clash.riderName}</span>
            <span className="text-[#8A94A3]">on {clash.horse}</span>
            <span className="basis-full text-[12px] text-[#8A94A3] sm:basis-auto sm:before:mx-1 sm:before:content-['—']">
              {clash.classA} <span className="text-[#8A94A3]">({clash.ringA})</span> vs{' '}
              {clash.classB} <span className="text-[#8A94A3]">({clash.ringB})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
