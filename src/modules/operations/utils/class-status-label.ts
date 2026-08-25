export function classStatusLabel(status: 'upcoming' | 'running' | 'done'): string {
  if (status === 'done') return 'Complete';
  if (status === 'running') return 'Running';
  return 'Upcoming';
}
