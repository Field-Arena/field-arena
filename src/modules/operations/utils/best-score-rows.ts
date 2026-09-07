import { disciplineOf } from '@/modules/operations/utils/discipline-of';
import type { BestScoreRow, ScheduleClass } from '@/modules/operations/types';

/* "Top 10 best scores of the day — by discipline" (showstaff-ops.html:496).
 * Every scored ride across every class, ranked, capped at 10. Legacy filtered
 * by discipline before slicing, so the filter changes WHICH ten you see — not
 * just which of a fixed ten are shown. Kept that way deliberately. */
export const BEST_SCORE_LIMIT = 10;

export function bestScoreRows(classes: ScheduleClass[], discipline = 'all'): BestScoreRow[] {
  const rows: BestScoreRow[] = [];
  for (const cls of classes) {
    const disc = disciplineOf(cls.label);
    if (discipline !== 'all' && disc !== discipline) continue;
    for (const entry of cls.entries) {
      if (entry.finalPctNum == null) continue;
      rows.push({
        num: entry.num,
        rider: entry.rider,
        horse: entry.horse,
        pct: entry.finalPctNum,
        pctRaw: entry.finalPctRaw,
        discipline: disc,
        className: cls.label,
      });
    }
  }
  return rows.sort((a, b) => b.pct - a.pct).slice(0, BEST_SCORE_LIMIT);
}

/** Distinct disciplines present, for the filter control. */
export function disciplinesIn(classes: ScheduleClass[]): string[] {
  return [...new Set(classes.map((c) => disciplineOf(c.label)))].sort((a, b) => a.localeCompare(b));
}
