export function StatusPill({ tone, label }: { tone: 'ok' | 'warn'; label: string }) {
  const c =
    tone === 'ok'
      ? { bg: '#E4F0E8', fg: '#2E7048', dot: '#3E8E5A' }
      : { bg: '#FBF0D4', fg: '#8A6D14', dot: '#C9A227' };
  return (
    <span
      className="inline-flex h-6 items-center gap-[7px] whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {label}
    </span>
  );
}
