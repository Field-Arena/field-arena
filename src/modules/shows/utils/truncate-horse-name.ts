/** Ported from showstaff.html's truncateHorseName — used across Horses and Stable Chart. */
export function truncateHorseName(name: string): string {
  const label = name || 'Horse';
  return label.length > 20 ? `${label.slice(0, 20)}…` : label;
}
