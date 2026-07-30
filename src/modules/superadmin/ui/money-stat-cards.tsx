import { cn } from '@/shared/lib/utils';

/**
 * The money stat cards from the Admin Console design's Billing screen.
 *
 * Separate filled cards with the figure ABOVE its label — deliberately not
 * ConsoleStatBar, which is one bordered strip with the label on top. The design
 * uses both shapes: the strip where a figure needs a sentence of context under
 * it, and these where the number is the point.
 */
export interface MoneyStat {
  label: string;
  value: string | number;
}

export function MoneyStatCards({ stats }: { stats: MoneyStat[] }) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-[196px] flex-1 rounded-xl border border-line-mint bg-[#F3F0E7] px-6 py-[22px]"
        >
          {/* A zero is greyed: it reads as "nothing here yet" rather than a
              measured result, which is how the console draws every empty figure. */}
          <div
            className={cn(
              'mb-1.5 font-[family-name:var(--font-nr)] text-[34px] leading-none',
              stat.value === 0 || stat.value === '$0.00'
                ? 'text-[#C4CDC8]'
                : 'text-hunter-deep'
            )}
          >
            {stat.value}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[.16em] text-fa-muted-2">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
