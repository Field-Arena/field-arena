import { LEAD_PILL, LEAD_STATUSES } from '@/modules/superadmin/constants';

const LABELS = new Map<string, string>(LEAD_STATUSES.map((s) => [s.value, s.label]));
const FALLBACK = { bg: '#EAF5EF', fg: '#475467', dot: '#8A94A3' };

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
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${
        size === 'md' ? 'h-[22px] px-2.5 text-[10.5px]' : 'h-5 px-2 text-[10.5px]'
      }`}
    >
      <span style={{ background: c.dot }} className="size-[5px] rounded-full" aria-hidden />
      {LABELS.get(key) ?? key}
    </span>
  );
}
