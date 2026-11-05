import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface MoneyStat {
  label: string;
  value: string | number;
  /** Optional icon on the redesign's tinted swatch. */
  icon?: ReactNode;
  tone?: 'emerald' | 'sky' | 'amber' | 'red' | 'violet';
}

export function MoneyStatCards({ stats }: { stats: MoneyStat[] }) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {stats.map((stat) => (
        <div key={stat.label} className="fa-stat min-w-[180px] flex-1">
          {stat.icon && (
            <div
              className="fa-ico"
              style={{
                background: `var(--fa-${stat.tone ?? 'emerald'}-tint)`,
                color: `var(--fa-${stat.tone ?? 'emerald'})`,
              }}
            >
              {stat.icon}
            </div>
          )}
          <div
            className={cn(
              'text-[26px] leading-none font-bold tracking-[-1px] tabular-nums',
              stat.value === 0 || stat.value === '$0.00' ? 'text-[#C3CAD3]' : 'text-[#101828]',
            )}
          >
            {stat.value}
          </div>
          <div className="mt-[7px] text-[11px] font-semibold tracking-[.08em] text-[#8A94A3] uppercase">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
