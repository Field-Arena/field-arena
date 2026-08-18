import { LEAD_PILL, LEAD_STATUSES } from '@/modules/superadmin/constants';

const LABELS = new Map<string, string>(LEAD_STATUSES.map((s) => [s.value, s.label]));
const FALLBACK = { bg: '#EDF5F1', fg: '#5A6B63', dot: '#9AA6A0' };

/**
 * The funnel's status pill — a coloured dot plus the stage label, using the
 * design's warm six-step palette (see LEAD_PILL). Colours are inline because they
 * are per-stage data, not utility classes.
 */
export function LeadStatusPill({
  status,
  size = 'sm',
}: {
  status: string | null;
  size?: 'sm' | 'md';
}) {
  const key = status ?? 'new';
  const c = LEAD_PILL[key] ?? LEAD_PILL.new ?? FALLBACK;
  return (
    <span
      style={{ background: c.bg, color: c.fg }}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold ${
        size === 'md' ? 'h-[22px] px-2.5 text-[10.5px]' : 'h-5 px-2 text-[10.5px]'
      }`}
    >
      <span style={{ background: c.dot }} className="size-[5px] rounded-full" aria-hidden />
      {LABELS.get(key) ?? key}
    </span>
  );
}
