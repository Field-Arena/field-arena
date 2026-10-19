import { cn } from '@/shared/lib/utils';
import { ribbonFor } from '@/modules/shows/constants';
import type { AwardSection } from '@/modules/shows/awards-engine';

export function SectionBox({ section }: { section: AwardSection }) {
  return (
    <div className="-ml-px min-w-0 border-t border-l border-[#EEF1F4] px-5 py-4 pb-[18px] print:break-inside-avoid">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="text-[10px] font-bold tracking-[.08em] whitespace-nowrap text-[#101828] uppercase">
          {section.title}
        </span>
        <span className="h-px flex-1 bg-[#EEF1F4]" />
        <span className="text-[11.5px] whitespace-nowrap text-[#8A94A3]">
          {section.rows.length} placed
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {section.rows.map((row) => {
          const ribbon = ribbonFor(row.rank, section.colors);

          return (
            <div
              key={`${row.num}-${row.name}-${String(row.rank)}`}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-[9px] px-2 py-1.5"
            >
              <span
                className={cn(
                  'grid size-[22px] place-items-center rounded-full text-[11.5px] font-bold',
                  ribbon.bg === '#FFFFFF' ? 'border border-[#BCC6C1]' : '',
                )}
                style={{ background: ribbon.bg, color: ribbon.fg }}
              >
                {row.rank + 1}
              </span>
              <span
                className={cn(
                  'overflow-hidden text-[15px] text-ellipsis whitespace-nowrap text-[#101828]',
                  row.rank === 0 ? 'font-bold' : 'font-semibold',
                )}
              >
                {row.name}
              </span>
              <span className="text-[13.5px] whitespace-nowrap text-[#8A94A3]">{row.horse}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
