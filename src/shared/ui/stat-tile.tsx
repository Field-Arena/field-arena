import { cn } from '@/shared/lib/utils';

/**
 * A single headline magnitude.
 *
 * Deliberately not a chart. One number answering "how many" has no shape to
 * plot — a bar of one bar, or a sparkline with no time axis, would add ink
 * without adding information. Because there is no plot there is also no hover
 * layer: the value is already fully visible, so a tooltip would only restate it.
 *
 * The value uses the serif face at a large size, matching the legacy stat cards,
 * so a number is legible from across a show office. Labels and sub-text wear
 * ordinary text tokens rather than an accent colour; only `tone` on the value
 * carries meaning, and it is reserved for money.
 */
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
    <div className={cn('rounded-xl border border-border bg-cream px-4 py-3.5', className)}>
      <div className="text-fa-muted text-[10.5px] font-bold uppercase tracking-[0.08em]">
        {label}
      </div>
      <div
        className={cn(
          'mt-1.5 font-serif text-[30px] font-bold leading-none',
          tone === 'money' ? 'text-status-success' : 'text-hunter-deep'
        )}
      >
        {value}
      </div>
      {sub && <div className="text-fa-muted mt-1 text-xs">{sub}</div>}
    </div>
  );
}
