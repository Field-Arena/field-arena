/** A schedule day's short label ("Aug 18"), or "Day N" before a start date exists to count from. */
export function formatDayDate(startDate: string | null, day: number): string {
  if (!startDate) return `Day ${String(day + 1)}`;
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
