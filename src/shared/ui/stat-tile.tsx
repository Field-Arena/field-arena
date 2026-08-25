import { cn } from '@/shared/lib/utils';

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'money';
  className?: string;
}) {
  return (
    <div className={cn('border-border bg-cream rounded-xl border px-4 py-3.5', className)}>
      <div className="text-fa-muted text-[10.5px] font-bold tracking-[0.08em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          'mt-1.5 font-serif text-[30px] leading-none font-bold',
          tone === 'money' ? 'text-status-success' : 'text-hunter-deep',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-fa-muted mt-1 text-xs">{sub}</div>}
    </div>
  );
}
