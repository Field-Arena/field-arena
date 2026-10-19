import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ConsoleStat {
  label: string;
  value: number | string;
  note: string;
  tone?: 'positive' | 'warn';
  icon: LucideIcon;
  iconTone: 'green' | 'blue' | 'purple' | 'amber';
}

const ICON_TONES = {
  green: 'bg-[#EAF5EF] text-[#15794F]',
  blue: 'bg-[#E3EDFB] text-[#2E5FA8]',
  purple: 'bg-[#EEE7FA] text-[#6B4FA0]',
  amber: 'bg-[#FBEADB] text-[#B2650F]',
} as const;

export function ConsoleStatBar({ stats }: { stats: ConsoleStat[] }) {
  return (
    <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-[14px] border border-[#E7EAEE] bg-white p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(16,24,40,.08)]"
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-[10px]',
                ICON_TONES[stat.iconTone],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>

            <span
              className={cn(
                'text-[26px] leading-none font-bold tracking-[-.02em] tabular-nums',
                stat.value === 0 ? 'text-[#C3CAD3]' : 'text-[#101828]',
              )}
            >
              {stat.value}
            </span>
            <span className="text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
              {stat.label}
            </span>
            <span
              className={cn(
                'text-[12.5px]',
                stat.tone === 'positive' && 'font-semibold text-[#15794F]',
                stat.tone === 'warn' && 'font-semibold text-[#B45309]',
                !stat.tone && 'text-[#8A94A3]',
              )}
            >
              {stat.note}
            </span>
          </div>
        );
      })}
    </div>
  );
}
