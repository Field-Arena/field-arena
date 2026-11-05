import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BODY,
  CATALOG_LEVELS,
  FM_SETS,
  GOVERNING_BODIES,
  groupsFor,
  type CatalogLevelKey,
  type GoverningBody,
} from './constants';

/* The Select Events test catalog: every test an organizer can offer from the
 * "Add tests from catalog" picker, tagged with its governing body and level.
 * Built from the same constants the add actions have always used (FM_SETS
 * for FEI, SM_HIERARCHY for the USEF/USDF categories), so ticking a test
 * writes exactly the class rows the old level picker did. */

export interface CatalogTest {
  key: string;
  body: GoverningBody;
  /** Stored as classes.event when offered. */
  category: string;
  /** Stored as classes.group_name when offered. */
  group: string;
  /** The catalog test name, stored inside classes.label. */
  test: string;
  /** What the organizer reads ("Training Level Freestyle"). */
  name: string;
  level: CatalogLevelKey;
  code: string;
  /** Position in catalog order — the level/test order within a body. */
  order: number;
  /** scoring_catalog.source_file (the legacy catalog id) of this test's
   * official scoresheet, or null when the platform has no sheet for it. */
  sheet: string | null;
}

/* Every catalog test's official Scoring Catalog sheet, keyed "group|test"
 * exactly as SM_HIERARCHY / FM_SETS spell them. The value is the legacy
 * catalog id (public/data/catalog.js), which is what scoring_catalog
 * .source_file holds for imported sheets — a stable key, unlike titles,
 * which SuperAdmin can edit. Legacy saved this id on the class (catalogId)
 * so official tests never needed Test Builder; this restores that. */
const OFFICIAL_SHEETS: Record<string, string> = {
  'Prix St. Georges|Prix St. Georges (2026)': 's-Prix_St__Georges_2026',
  'Intermediate A|Intermediate A (2026)': 's-Intermediate_A_2026',
  'Intermediate B|Intermediate B (2026)': 's-Intermediate_B_2026',
  'Intermediate I|Intermediate I (2026)': 's-Intermediate_I_2026_0',
  'Intermediate I|Intermediate I Freestyle (2022)': 's-Intermediate_I_Freestyle_2022',
  'Grand Prix|Grand Prix (2026)': 's-Grand_Prix_2026_0',
  'Grand Prix|Grand Prix Freestyle (2022)': 's-Grand_Prix_Freestyle_2022',
  'Introductory|Introductory Test A': 's-2023_Intro_A',
  'Introductory|Introductory Test B': 's-2023_Intro_B',
  'Introductory|Introductory Test C': 's-2023_Intro_C',
  'Training Level|Training Level Test 1': 's-2023_Training_1_4_7',
  'Training Level|Training Level Test 2': 's-2023_Training_2_4_7',
  'Training Level|Training Level Test 3': 's-2023_Training_3_4_7',
  'First Level|First Level Test 1': 's-2023_First_Level_Test_1_4_12',
  'First Level|First Level Test 2': 's-2023_First_Level_Test_2_8_30',
  'First Level|First Level Test 3': 's-2023_First_Level_Test_3_10_4',
  'Second Level|Second Level Test 1': 's-2023_Second_Level_Test_1_8_30',
  'Second Level|Second Level Test 2': 's-2023_Second_Level_Test_2_8_30',
  'Second Level|Second Level Test 3': 's-2023_Second_Level_Test_3_4_20',
  'Third Level|Third Level Test 1': 's-2023_Third_Level_Test_1_8_30',
  'Third Level|Third Level Test 2': 's-2023_Third_Level_Test_2_4_20',
  'Third Level|Third Level Test 3': 's-2023_Third_Level_Test_3',
  'Fourth Level|Fourth Level Test 1': 's-2023_Fourth_Level_Test_1__8_30',
  'Fourth Level|Fourth Level Test 2': 's-2023_Fourth_Level_Test_2',
  'Fourth Level|Fourth Level Test 3': 's-2023_Fourth_Level_Test_3_10_1',
  'Freestyle|Training Level': 's-2023_Freestyle_Training_Level',
  'Freestyle|First Level': 's-2023_Freestyle_First_Level',
  'Freestyle|Second Level': 's-2023_Freestyle_Second_Level',
  'Freestyle|Third Level': 's-2023_Freestyle_Third_Level',
  'Freestyle|Fourth Level': 's-2023_Freestyle_Fourth_Level',
  'Pas de Deux|Pas de Deux': 's-2023_Pas_de_Deux',
  'Quadrille|Introductory Level': 's-Quad_Introductory_Level_Test',
  'Quadrille|Training Level': 's-Quad_Training_Level_Test',
  'Quadrille|First Level': 's-Quad_First_Level_Test',
  'Quadrille|Second Level': 's-Quad_Second_Level_Test',
  'Quadrille|Third Level': 's-Quad_Third_Level_Test',
  'Quadrille|Freestyle': 's-Quadrille_Freestyle',
  'Individual Class|Prospect (in hand)': 's-2023_USDF_Dressage_Sport_Horse_Prospects_InHand',
  'Individual Class|Breeding Stock (in hand)':
    's-2023_USDF_Dressage_Sport_Horse_Breeding_Stock_InHand',
  'Individual Class|Group Class (in hand)': 's-2023_USDF_Dressage_Sport_Horse_Group_Class',
  'Individual Class|Prospect (under saddle)':
    's-2023_USDF_Dressage_Sport_Horse_Prospects_Under_Saddle',
  'Master Class|Prospect (in hand)': 's-2023_USDF_Dressage_Sport_Horse_Prospect_In_Hand_Master',
  'Master Class|Breeding Stock (in hand)':
    's-2023_USDF_Dressage_Sport_Horse_Breeding_Stock_In_Hand_Master',
  'Master Class|Group Class (in hand)': 's-2023_USDF_Dressage_Sport_Horse_Group_Class_Master',
  'Master Class|Prospect (under saddle)':
    's-2023_USDF_Dressage_Sport_Horse_Prospect_Under_Saddle_Master',
  'Championship|Sport Horse Championship Class':
    's-2023_USDF_Dressage_Sport_Horse_Championship_Class_Sheet',
  'Materiale|Sport Horse Materiale Class': 's-2023_Materiale_Scoresheet',
  'Handler|Amateur / Junior / Young Rider Handler': 's-2023_Amateur_Jr_YRHandler_scoresheet',
  'Equitation|Dressage Seat Equitation': 's-2023_DSE_Score_Sheet',
  'Dressage Seat Medals|Dressage Seat Medals': 's-2023_DSM_Score_Sheet',
  'Young Horse|Four-Year-Old Dressage Test': 's-2023_FourYearOld_Dressage_test',
  'Developing Horse|Prix St. Georges, 7-9yo': 's-2023_Developing_Horse_Prix_St_George',
  'Developing Horse|Grand Prix, 8-10yo': 's-2023_Developing_Horse_Grand_Prix',
};

const YEAR_SUFFIX = /\s*\(\d{4}\)\s*$/;

/** "Training Level" → "TL" etc., matching the prototype's test codes. */
const LEVEL_CODES: Record<string, string> = {
  introductory: 'INT',
  intro: 'INT',
  'introductory level': 'INT',
  'training level': 'TL',
  'first level': 'FL',
  'second level': 'SL',
  'third level': 'TH',
  'fourth level': 'FR',
  'prix st georges': 'PSG',
  'grand prix': 'GP',
  'grand prix special': 'GP-S',
  intermediate: 'I',
};

/** A short badge for a test name: "Training Level Test 1" → "TL-1",
 * "First Level Freestyle" → "FL-F", "Grand Prix (2026)" → "GP". */
const FULL_CODES: Record<string, string> = {
  'intermediate i': 'I-1',
  'intermediate i freestyle': 'I1-F',
  'intermediate ii': 'I-2',
  'pas de deux': 'PDD',
  'quadrille freestyle': 'Q-F',
};

export function testCodeFor(name: string): string {
  const master = / · Master Class$/.exec(name);
  if (master) return `${testCodeFor(name.slice(0, master.index))}-M`;
  if (/^quadrille /i.test(name) && !/freestyle/i.test(name))
    return `Q-${testCodeFor(name.replace(/^quadrille /i, ''))}`;
  const full = FULL_CODES[normalizeTestName(name).replace(/[^\p{L}\p{N}\s]/gu, '')];
  if (full) return full;
  const clean = name
    .replace(YEAR_SUFFIX, '')
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const freestyle = /\bfreestyle\b/i.test(clean);
  let rest = clean.replace(/\bfreestyle\b/gi, '').trim();

  let tail: string | undefined;
  if (!freestyle) {
    const m = /(?:\btest\s+)?\b(\d+|[A-Z]{1,2}|I{1,3})$/.exec(rest);
    if (m?.[1] && m.index > 0) {
      tail = m[1].toUpperCase();
      rest = rest.slice(0, m.index).trim();
    }
  }
  const words = rest.split(/[\s/-]+/).filter((w) => w && !/^(test|class|of|de|the|and)$/i.test(w));
  const joined = words.join(' ').toLowerCase();
  const head =
    LEVEL_CODES[joined] ??
    (words.length === 1
      ? (words[0] ?? '').slice(0, 3).toUpperCase()
      : words
          .map((w) => w[0]?.toUpperCase() ?? '')
          .join('')
          .slice(0, 4));
  const base = head || 'CL';
  if (freestyle) return `${base}-F`;
  return tail ? `${base}-${tail}` : base;
}

/** Level bucket for a class name (used for classes the catalog doesn't know). */
export function levelForName(name: string): CatalogLevelKey {
  if (/\b(freestyle|pas de deux|quadrille)\b/i.test(name)) return 'freestyle';
  if (/\bintro/i.test(name)) return 'intro';
  if (/\btraining\b/i.test(name)) return 'training';
  if (/\bfirst\b/i.test(name)) return 'first';
  if (/\bsecond\b/i.test(name)) return 'second';
  if (/\bthird\b/i.test(name)) return 'third';
  if (/\bfourth\b/i.test(name)) return 'fourth';
  if (/\b(psg|prix st|intermediate|grand prix|young rider|junior|children|pony)\b/i.test(name))
    return 'fei';
  if (/\bwestern\b/i.test(name)) return 'western';
  return 'other';
}

export function levelStyle(level: CatalogLevelKey): { name: string; color: string } {
  const hit = CATALOG_LEVELS.find((l) => l.key === level);
  return { name: hit?.name ?? 'Other', color: hit?.color ?? '#8a94a3' };
}

export function levelRank(level: CatalogLevelKey): number {
  return CATALOG_LEVELS.findIndex((l) => l.key === level);
}

/** Organizer-facing name for a catalog group + test. */
function displayName(category: string, group: string, test: string): string {
  if (group === 'Freestyle') return `${test} Freestyle`;
  if (group === 'Quadrille')
    return test === 'Freestyle' ? 'Quadrille Freestyle' : `Quadrille ${test}`;
  if (group === 'Master Class') return `${test} · Master Class`;
  if (category === 'Developing Horse / Young Horse' && group === 'Developing Horse')
    return `Developing Horse ${test}`;
  return test;
}

function levelFor(category: string, group: string, test: string): CatalogLevelKey {
  if (category === 'FEI') return 'fei';
  if (category === 'Sport Horse') return 'sporthorse';
  if (category === 'Dressage Seat Equitation') return 'equitation';
  if (category === 'Developing Horse / Young Horse')
    return group === 'Developing Horse' ? 'developing' : 'young';
  if (category === 'Freestyle / Pas de Deux / Quadrille') return 'freestyle';
  return levelForName(`${group} ${test}`);
}

export function normalizeTestName(name: string): string {
  return name.replace(YEAR_SUFFIX, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function catalogTestKey(group: string | null, test: string): string {
  return `${(group ?? '').toLowerCase()}|${normalizeTestName(test)}`;
}

function buildCatalog(): CatalogTest[] {
  const rows: Omit<CatalogTest, 'order'>[] = [];
  const push = (body: GoverningBody, category: string, group: string, test: string) => {
    const name = displayName(category, group, test);
    rows.push({
      key: catalogTestKey(group, test),
      body,
      category,
      group,
      test,
      name,
      level: levelFor(category, group, test),
      code: testCodeFor(name),
      sheet: OFFICIAL_SHEETS[`${group}|${test}`] ?? null,
    });
  };

  for (const level of FM_SETS['+ FEI']) {
    for (const test of level.tests) push('FEI', 'FEI', level.name, test);
  }
  for (const category of CATALOG_CATEGORIES) {
    for (const { group, tests } of groupsFor(category)) {
      for (const test of tests) push(CATALOG_CATEGORY_BODY[category], category, group, test);
    }
  }

  const bodyRank = (b: GoverningBody) => GOVERNING_BODIES.indexOf(b);
  return rows
    .map((row, i) => ({ row, i }))
    .sort(
      (a, b) =>
        bodyRank(a.row.body) - bodyRank(b.row.body) ||
        (a.row.body === 'USEF/USDF' ? levelRank(a.row.level) - levelRank(b.row.level) : 0) ||
        a.i - b.i,
    )
    .map(({ row }, order) => ({ ...row, order }));
}

/** The full catalog in body → level → test order. */
export const TEST_CATALOG: readonly CatalogTest[] = buildCatalog();

/** Index for matching an offered class back to its catalog test: by group +
 * test first, then by a test/display name that is unique in the catalog
 * (seeded classes carry no group; FM_SETS ones carry a year suffix). */
export function buildCatalogIndex(catalog: readonly CatalogTest[]) {
  const byKey = new Map(catalog.map((t) => [t.key, t]));
  const byName = new Map<string, CatalogTest | null>();
  const add = (name: string, t: CatalogTest) => {
    const k = normalizeTestName(name);
    byName.set(k, byName.has(k) && byName.get(k) !== t ? null : t);
  };
  for (const t of catalog) {
    add(t.test, t);
    if (t.name !== t.test) add(t.name, t);
  }
  return (group: string | null, test: string): CatalogTest | null =>
    byKey.get(catalogTestKey(group, test)) ?? byName.get(normalizeTestName(test)) ?? null;
}

export const findCatalogTest = buildCatalogIndex(TEST_CATALOG);

/** The official sheet (scoring_catalog.source_file) for a test an organizer
 * offered, or null for anything that isn't an official catalog test. Also
 * resolves the older FM_SETS spelling ("Introductory Level Test A (2023)"). */
export function officialSheetFor(group: string | null, test: string): string | null {
  const hit =
    findCatalogTest(group, test) ??
    findCatalogTest(null, test.replace(/^introductory level test\b/i, 'Introductory Test'));
  return hit?.sheet ?? null;
}
