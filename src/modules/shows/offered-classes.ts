import {
  BODY_COLORS,
  DEFAULT_CLASS_FEE,
  DIVISION_DISPLAY_ORDER,
  EXTRA_CLASS_GROUPS,
  GOVERNING_BODIES,
  type CatalogLevelKey,
  type ExtraClassGroup,
  type GoverningBody,
} from './constants';
import {
  TEST_CATALOG,
  findCatalogTest,
  levelForName,
  levelRank,
  testCodeFor,
  type CatalogTest,
} from './test-catalog';
import { formatMoney } from '@/shared/lib/format/currency';
import type { SelectEventsData, SelectEventsDivisionOption } from '@/modules/shows/types';

type ClassRow = SelectEventsData['classes'][number];
export type OfferedGroupKey = GoverningBody | ExtraClassGroup;

export interface OfferedTest {
  key: string;
  /** Organizer-facing class name. */
  test: string;
  group: string | null;
  body: OfferedGroupKey;
  level: CatalogLevelKey;
  code: string;
  /** The catalog test this class was offered from, if any. */
  catalogKey: string | null;
  catalogOrder: number;
  classes: ClassRow[];
  /** Show divisions this test is offered in (one class row per division). */
  divisionsOn: string[];
  fee: number;
  feeMixed: boolean;
  qualifying: boolean;
  entries: number;
}

export interface OfferedSection {
  body: OfferedGroupKey;
  color: string;
  tests: OfferedTest[];
}

/* Class labels are written "Group — Test — Division" (or "Group — Test")
 * by the catalog mutations; custom and TOC classes carry a free label. */
const isToc = (c: ClassRow) => c.event === 'TOC' || c.label.startsWith('Test of Choice — ');

function testNameOf(c: ClassRow): string {
  const parts = c.label.split(' — ');
  if (isToc(c)) return c.displayName ?? parts[1] ?? parts[0] ?? c.label;
  if (c.groupName && parts[0] === c.groupName && parts[1]) return parts[1];
  return parts[0] ?? c.label;
}

const GROUP_ORDER: readonly OfferedGroupKey[] = [
  ...GOVERNING_BODIES,
  ...EXTRA_CLASS_GROUPS.map((g) => g.key),
];

export function groupColor(body: OfferedGroupKey): string {
  if ((GOVERNING_BODIES as readonly string[]).includes(body))
    return BODY_COLORS[body as GoverningBody];
  return EXTRA_CLASS_GROUPS.find((g) => g.key === body)?.color ?? '#8a94a3';
}

function asBody(value: string | null): GoverningBody | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  return GOVERNING_BODIES.find((b) => b === v) ?? null;
}

/** Which header a class sits under: its catalog body when it came from the
 * catalog, else TOC / Custom / Independent by event, else a body recorded on
 * the class, else Other. (classes.event can hold a show name on seeded data,
 * so it is never used as a header on its own.) */
function bodyOf(c: ClassRow, match: CatalogTest | null): OfferedGroupKey {
  if (match) return match.body;
  if (isToc(c)) return 'Test of Choice';
  if (c.event === 'Custom') return 'Custom';
  if (c.event === 'Independent') return 'Independent';
  return asBody(c.event) ?? asBody(c.governingBody) ?? 'Other';
}

/** Folds per-division class rows into one row per test, grouped by governing
 * body (prototype order) and sorted by level then test within each group. */
export function groupOfferedClasses(data: SelectEventsData): OfferedSection[] {
  const showDivisions = new Set(data.divisions.map((d) => d.name));
  const byKey = new Map<string, OfferedTest>();

  for (const c of data.classes) {
    const raw = testNameOf(c);
    const match = isToc(c) || c.event === 'Custom' ? null : findCatalogTest(c.groupName, raw);
    const key = match ? `cat:${match.key}` : `${c.groupName ?? ''}|${raw}`;
    let row = byKey.get(key);
    if (!row) {
      const name = match?.name ?? raw;
      row = {
        key,
        test: name,
        group: c.groupName,
        body: bodyOf(c, match),
        level: match?.level ?? levelForName(`${c.groupName ?? ''} ${raw}`),
        code: match?.code ?? testCodeFor(name),
        catalogKey: match?.key ?? null,
        catalogOrder: match?.order ?? Number.MAX_SAFE_INTEGER,
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

  const sections = new Map<OfferedGroupKey, OfferedTest[]>();
  for (const row of byKey.values()) {
    const list = sections.get(row.body) ?? [];
    list.push(row);
    sections.set(row.body, list);
  }

  return [...sections.entries()]
    .sort(([a], [b]) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b))
    .map(([body, tests]) => ({
      body,
      color: groupColor(body),
      tests: tests.sort(
        (a, b) =>
          levelRank(a.level) - levelRank(b.level) ||
          a.catalogOrder - b.catalogOrder ||
          a.test.localeCompare(b.test, undefined, { numeric: true }),
      ),
    }));
}

/** Stat cards above the Offered classes table. */
export function selectEventsStats(data: SelectEventsData, sections: OfferedSection[]) {
  const tests = sections.flatMap((s) => s.tests);
  const fees = data.classes.map((c) => c.fee);
  const minFee = fees.length > 0 ? Math.min(...fees) : 0;
  const maxFee = fees.length > 0 ? Math.max(...fees) : 0;
  const entries = data.classes.reduce((sum, c) => sum + c.entryCount, 0);
  return {
    testCount: tests.length,
    cards: [
      {
        num: String(tests.length),
        lab: 'Classes offered',
        sub: `from a ${String(TEST_CATALOG.length)}-test catalog`,
      },
      {
        num:
          fees.length === 0
            ? '—'
            : minFee === maxFee
              ? formatMoney(minFee)
              : `${formatMoney(minFee)}–${formatMoney(maxFee)}`,
        lab: 'Fee range',
        sub: 'price per event',
      },
      {
        num: String(tests.filter((t) => t.qualifying).length),
        lab: 'Qualifying',
        sub: 'championship rides',
      },
      { num: String(entries), lab: 'Entries so far', sub: 'across offered classes' },
    ],
  };
}

/** Division toggles in prototype order: Open · AA · Jr, then the rest. */
export function orderedDivisions<T extends { name: string }>(divisions: readonly T[]): T[] {
  const rank = (name: string) => {
    const i = DIVISION_DISPLAY_ORDER.findIndex((re) => re.test(name));
    return i === -1 ? DIVISION_DISPLAY_ORDER.length : i;
  };
  return divisions
    .map((d, i) => ({ d, i }))
    .sort((a, b) => rank(a.d.name) - rank(b.d.name) || a.i - b.i)
    .map(({ d }) => d);
}

/** Short labels for the division toggles ("Adult Amateur" → "AA",
 * "Junior Rider" → "Jr"). */
export function divisionShort(name: string): string {
  const paren = /\(([^)]+)\)/.exec(name)?.[1];
  if (paren) return paren.split('/')[0] ?? paren;
  if (/^junior/i.test(name)) return 'Jr';
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return name.length <= 5 ? name : name.slice(0, 4);
  return words.map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/** Fee a newly offered test gets in one division: the picker's price if
 * typed, else the division's default, else the show-wide default. */
export function feeForNewTest(
  division: SelectEventsDivisionOption | undefined,
  typedPrice: number | null,
): number {
  return typedPrice ?? division?.defaultFee ?? DEFAULT_CLASS_FEE;
}
