export function truncateHorseName(name: string): string {
  const label = name || 'Horse';
  return label.length > 20 ? `${label.slice(0, 20)}…` : label;
}
