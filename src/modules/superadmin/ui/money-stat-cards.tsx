import { cn } from '@/shared/lib/utils';

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
          className="border-line-mint min-w-[196px] flex-1 rounded-xl border bg-[#F3F0E7] px-6 py-[22px]"
        >
          <div
            className={cn(
              'mb-1.5 font-[family-name:var(--font-nr)] text-[34px] leading-none',
              stat.value === 0 || stat.value === '$0.00' ? 'text-[#C4CDC8]' : 'text-hunter-deep',
            )}
          >
            {stat.value}
          </div>
          <div className="text-fa-muted-2 text-[10px] font-bold tracking-[.16em] uppercase">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
