export function fmtTimeLabel(time: string | null): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const minutes = m[2] ?? '00';
  let h = Number(m[1] ?? '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h)}:${minutes} ${ampm}`;
}
