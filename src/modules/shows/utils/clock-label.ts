/** Minutes after midnight as a 12-hour clock label, e.g. 545 -> "9:05 AM". */
export function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12)}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
