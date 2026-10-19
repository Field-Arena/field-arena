export function StatusPill({ tone, label }: { tone: 'ok' | 'warn'; label: string }) {
  const c =
    tone === 'ok'
      ? { bg: '#EAF5EF', fg: '#15794F', dot: '#146A47' }
      : { bg: '#FDF2E3', fg: '#B45309', dot: '#146A47' };
  return (
    <span
      className="inline-flex h-6 items-center gap-[7px] rounded-full px-2.5 text-[11.5px] font-bold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {label}
    </span>
  );
}
