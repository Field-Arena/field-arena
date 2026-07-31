import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * The console's summary strip: four bordered cards, each opened by a colored
 * icon badge — replaces the single divided strip the console previously used.
 * Matched from the current Admin Console design ("Crispers Design System"
 * export); there is no HTML source for this screen the way the landing page
 * had one, so the icon-badge colors below are read off the reference
 * screenshot rather than lifted from an exact token, and may drift a shade
 * from the design tool's real values.
 *
 * Each figure carries a note under it, and the note is where the meaning lives —
 * "5 organizers" alone says nothing about whether that is healthy, while
 * "3 onboard · 2 pending" does. The design colours those notes: green when the
 * number is doing well, amber when it wants attention, grey when it is just
 * context.
 */
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
    <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-[22px]"
          >
            <span
              className={cn(
                'grid size-10 place-items-center rounded-[10px]',
                ICON_TONES[stat.iconTone]
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>

            {/* A zero is greyed: it reads as "nothing here yet" rather than as a
                measured result, which is how the design draws empty counts. */}
            <span
              className={cn(
                'font-[family-name:var(--font-nr)] text-4xl leading-none',
                stat.value === 0 ? 'text-[#C4CDC8]' : 'text-forest'
              )}
            >
              {stat.value}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-fa-muted-2">
              {stat.label}
            </span>
            <span
              className={cn(
                'text-[12.5px]',
                stat.tone === 'positive' && 'font-semibold text-[#2E7048]',
                stat.tone === 'warn' && 'font-semibold text-[#8A6D14]',
                !stat.tone && 'text-fa-muted-2'
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
