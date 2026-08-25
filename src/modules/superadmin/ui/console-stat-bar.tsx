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
  green: 'bg-[#E4F1E8] text-[#2E7048]',
  blue: 'bg-[#E3EDFB] text-[#2E5FA8]',
  purple: 'bg-[#EEE7FA] text-[#6B4FA0]',
  amber: 'bg-[#FBEADB] text-[#B2650F]',
} as const;

export function ConsoleStatBar({ stats }: { stats: ConsoleStat[] }) {
  return (
    <div className="mb-7 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="border-line flex flex-col gap-2 rounded-[14px] border bg-white p-4"
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
                'font-[family-name:var(--font-nr)] text-[28px] leading-none',
                stat.value === 0 ? 'text-[#C4CDC8]' : 'text-forest',
              )}
            >
              {stat.value}
            </span>
            <span className="text-fa-muted-2 text-[10px] font-bold tracking-[.16em] uppercase">
              {stat.label}
            </span>
            <span
              className={cn(
                'text-[12.5px]',
                stat.tone === 'positive' && 'font-semibold text-[#2E7048]',
                stat.tone === 'warn' && 'font-semibold text-[#8A6D14]',
                !stat.tone && 'text-fa-muted-2',
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
