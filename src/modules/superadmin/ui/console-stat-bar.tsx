import { cn } from '@/shared/lib/utils';

/**
 * The console's summary strip: one bordered container divided by internal rules,
 * not a row of separate cards.
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
}

export function ConsoleStatBar({ stats }: { stats: ConsoleStat[] }) {
  return (
    <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] overflow-hidden rounded-[14px] border border-line bg-white">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            'flex flex-col gap-2 px-[22px] pb-[22px] pt-5',
            index < stats.length - 1 && 'border-r border-line'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-[.16em] text-fa-muted-2">
            {stat.label}
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
      ))}
    </div>
  );
}
