import { rideTestCode } from './utils/schedule-level';
import type { SelectEventsData } from '@/modules/shows/types';

type ClassRow = SelectEventsData['classes'][number];

export interface OfferedTest {
  key: string;
  test: string;
  group: string | null;
  category: string;
  code: string;
  classes: ClassRow[];
  /** Show divisions this test is offered in (one class row per division). */
  divisionsOn: string[];
  fee: number;
  feeMixed: boolean;
  qualifying: boolean;
  entries: number;
}

export interface OfferedSection {
  category: string;
  tests: OfferedTest[];
}

/* Class labels are written "Group — Test — Division" (or "Group — Test")
 * by the catalog mutations; custom and TOC classes carry a free label. */
function testNameOf(c: ClassRow): string {
  const parts = c.label.split(' — ');
  if (c.groupName && parts[0] === c.groupName && parts[1]) return parts[1];
  return parts[0] ?? c.label;
}

/** A short badge for a test: "Training Level" + "Test 1" → "TL-1". */
export function testCode(group: string | null, test: string): string {
  return rideTestCode(group ? `${group} — ${test}` : test);
}

/** Folds per-division class rows into one row per test, grouped by category
 * in catalog order, for the Offered classes table. */
export function groupOfferedClasses(
  data: SelectEventsData,
  categoryOrder: readonly string[],
): OfferedSection[] {
  const showDivisions = new Set(data.divisions.map((d) => d.name));
  const byKey = new Map<string, OfferedTest>();

  for (const c of data.classes) {
    const test = testNameOf(c);
    const key = `${c.groupName ?? ''}|${test}`;
    let row = byKey.get(key);
    if (!row) {
      row = {
        key,
        test,
        group: c.groupName,
        category: c.event ?? 'Other',
        code: testCode(c.groupName, test),
        classes: [],
        divisionsOn: [],
        fee: c.fee,
        feeMixed: false,
        qualifying: false,
        entries: 0,
      };
      byKey.set(key, row);
    }
    row.classes.push(c);
    if (c.division && showDivisions.has(c.division)) row.divisionsOn.push(c.division);
    if (c.fee !== row.fee) row.feeMixed = true;
    row.fee = Math.min(row.fee, c.fee);
    row.qualifying ||= c.qualifying;
    row.entries += c.entryCount;
  }

  const sections = new Map<string, OfferedTest[]>();
  for (const row of byKey.values()) {
    const list = sections.get(row.category) ?? [];
    list.push(row);
    sections.set(row.category, list);
  }

  const rank = (category: string) => {
    const i = categoryOrder.indexOf(category);
    return i === -1 ? categoryOrder.length : i;
  };
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([category, tests]) => ({ category, tests }));
}
