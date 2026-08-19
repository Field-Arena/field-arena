export function formatClassTime(time: string | null): string | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] ?? '00';
  if (Number.isNaN(hours) || hours > 23) return null;
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = ((hours + 11) % 12) + 1;
  return `${String(h12)}:${minutes} ${period}`;
}
