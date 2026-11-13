import { levelForName, levelRank } from '../test-catalog';
import type { TestCatalogEntry, TestTemplateRow } from '../types';

export type TestPickerKind = 'org' | 'official';

export interface TestPickerOption {
  /** Unique across both groups — template and catalog ids live in different tables. */
  key: string;
  kind: TestPickerKind;
  id: string;
  name: string;
  level: string | null;
  governingBody: string | null;
  /** Classes on this show using the test (org tests only; 0 for official). */
  usedBy: number;
}

export interface TestPickerLevelGroup {
  level: string;
  options: TestPickerOption[];
}

export interface TestPickerGroup {
  kind: TestPickerKind;
  title: string;
  levels: TestPickerLevelGroup[];
  count: number;
}

const NO_LEVEL = 'No level set';

export function testPickerKey(kind: TestPickerKind, id: string): string {
  return `${kind}:${id}`;
}

function matches(option: TestPickerOption, needle: string): boolean {
  if (!needle) return true;
  return [option.name, option.level ?? '', option.governingBody ?? ''].some((field) =>
    field.toLowerCase().includes(needle),
  );
}

// Levels in riding order (Intro → Training → First … → FEI) rather than
// alphabetical, which would put "First Level" ahead of "Training Level".
function compareLevels(a: string, b: string): number {
  if (a === NO_LEVEL || b === NO_LEVEL) return a === b ? 0 : a === NO_LEVEL ? 1 : -1;
  return levelRank(levelForName(a)) - levelRank(levelForName(b)) || a.localeCompare(b);
}

function groupByLevel(options: TestPickerOption[]): TestPickerLevelGroup[] {
  const byLevel = new Map<string, TestPickerOption[]>();
  for (const option of options) {
    const trimmed = option.level?.trim();
    const level = trimmed === undefined || trimmed === '' ? NO_LEVEL : trimmed;
    const bucket = byLevel.get(level) ?? [];
    bucket.push(option);
    byLevel.set(level, bucket);
  }
  return [...byLevel.entries()]
    .sort(([a], [b]) => compareLevels(a, b))
    .map(([level, list]) => ({
      level,
      options: list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    }));
}

/** The Test Builder picker's two groups — the org's own tests, then the
 * official catalog — each sub-grouped by level and filtered by `query`
 * against name, level and governing body. Empty groups are dropped. */
export function buildTestPickerGroups(
  templates: TestTemplateRow[],
  catalog: TestCatalogEntry[],
  usedByTemplateId: Record<string, number>,
  query: string,
): TestPickerGroup[] {
  const needle = query.trim().toLowerCase();

  const org = templates
    .map((t): TestPickerOption => ({
      key: testPickerKey('org', t.id),
      kind: 'org',
      id: t.id,
      name: t.name,
      level: t.level,
      governingBody: t.governingBody,
      usedBy: usedByTemplateId[t.id] ?? 0,
    }))
    .filter((o) => matches(o, needle));

  const official = catalog
    .map((c): TestPickerOption => ({
      key: testPickerKey('official', c.id),
      kind: 'official',
      id: c.id,
      name: c.title,
      level: c.level,
      governingBody: c.governingBody,
      usedBy: 0,
    }))
    .filter((o) => matches(o, needle));

  const groups: TestPickerGroup[] = [
    {
      kind: 'org',
      title: "Your organization's tests",
      levels: groupByLevel(org),
      count: org.length,
    },
    {
      kind: 'official',
      title: 'Official tests (USEF/USDF/FEI catalog)',
      levels: groupByLevel(official),
      count: official.length,
    },
  ];
  return groups.filter((g) => g.count > 0);
}

/** Options in on-screen order, for arrow-key navigation. */
export function flattenTestPickerGroups(groups: TestPickerGroup[]): TestPickerOption[] {
  return groups.flatMap((g) => g.levels.flatMap((l) => l.options));
}
