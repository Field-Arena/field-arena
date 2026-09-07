/* Discipline is not a column — legacy derived it from the class name, and the
 * results leaderboard groups by it. Straight port of showstaff-ops.html:491:
 *
 *   FEI / Prix / Grand Prix / Intermediate  → "FEI"
 *   anything ending "…Level" or "Introductory" → that prefix
 *   otherwise → the class name itself
 */
export function disciplineOf(className: string): string {
  if (/FEI|Prix|Grand Prix|Intermediate/i.test(className)) return 'FEI';
  const match = /^(.*?Level|Introductory)/.exec(className);
  return match?.[1] ?? className;
}
