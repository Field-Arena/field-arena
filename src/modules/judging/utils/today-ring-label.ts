export function todayRingLabel(rings: string[], assignmentsToday: number): string {
  if (rings.length > 0) return rings.join(', ');
  if (assignmentsToday > 0) {
    return `${String(assignmentsToday)} assignment${assignmentsToday === 1 ? '' : 's'} today — ring not set`;
  }
  return 'No assignments today';
}
