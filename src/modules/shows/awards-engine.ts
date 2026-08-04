/**
 * Awarding rules, ported from showstaff.html's awardUnitsFor / unitPlacings /
 * pctThenCtotDesc / withSharedRank.
 *
 * Pure, and separate from the query for the same reason the schedule engine is:
 * these rules decide who physically gets handed a ribbon, and getting them
 * wrong is the kind of mistake that is discovered in the ring.
 */

import { ribbonFor, type RibbonColor } from './constants';

export const DIVISION_ORDER = ['J', 'Y', 'A', 'O'] as const;

export const DIVISION_FULL: Record<string, string> = {
  J: 'Junior',
  Y: 'Young Rider',
  A: 'Adult Am.',
  O: 'Open',
};

/** Anything outside the four known codes is Open — divisionLabel's own rule. */
export function divisionLabel(division: string | null): string {
  return DIVISION_ORDER.find((d) => d === division) ?? 'O';
}

/**
 * The level a class belongs to, ported verbatim from disciplineOf().
 *
 * Pattern-matched off the class name rather than read from a column, because
 * that is what the legacy did and what its award pooling is scoped by — a
 * different rule here would pool different classes together.
 */
export function disciplineOf(name: string): string {
  if (/FEI|Prix|Grand Prix|Intermediate/i.test(name)) return 'FEI';
  const match = /^(.*?Level|Introductory)/.exec(name);
  return match?.[1] ?? name;
}

export interface AwardEntry {
  num: string;
  name: string;
  horse: string;
  /** Final percentage. Null means unscored — never placed. */
  pct: number | null;
  /** Collective total, the tie-break. Null means the tie stands. */
  ctot: number | null;
  division: string;
}

export interface AwardClassInput {
  id: string;
  /** The class's own name — what pooling and level bucketing read. */
  label: string;
  awardScope: string;
  division: string | null;
  groupName: string | null;
  ribbonPlaces: number;
  ribbonColors: RibbonColor[] | null;
  entries: AwardEntry[];
}

export interface AwardUnit {
  label: string;
  classes: AwardClassInput[];
  ribbonPlaces: number;
  ribbonColors: RibbonColor[] | null;
  /** True when several classes share one ribbon set. */
  pooled: boolean;
}

/**
 * Groups classes into the units that actually get ribboned.
 *
 * A class left at award_scope 'class' stays its own unit. One set to 'division'
 * or 'group' is pooled with every other class in the same list sharing both
 * that scope and the same division/group value — so every Training Level test
 * awards one shared Training Level championship rather than a separate ribbon
 * set per test.
 *
 * Callers pass one level's classes at a time (see disciplineOf), because
 * pooling must never reach across an unrelated level by accident.
 *
 * A pooled unit takes the LARGEST ribbon count of its members: a pool that
 * awards six places in one of its classes cannot award four overall without
 * quietly dropping a placing someone earned.
 */
export function awardUnitsFor(classes: AwardClassInput[]): AwardUnit[] {
  const units: AwardUnit[] = [];
  const byPoolKey = new Map<string, AwardUnit>();

  for (const cls of classes) {
    const scope = cls.awardScope || 'class';

    if (scope !== 'division' && scope !== 'group') {
      units.push({
        label: cls.label,
        classes: [cls],
        ribbonPlaces: cls.ribbonPlaces,
        ribbonColors: cls.ribbonColors,
        pooled: false,
      });
      continue;
    }

    // An unset — or blank — division/group name pools under the class's own
    // name, so a half-configured class still gets a unit rather than joining
    // every other unnamed one.
    const named = scope === 'division' ? cls.division : cls.groupName;
    const groupValue = named == null || named === '' ? cls.label : named;
    const key = `${scope}::${groupValue}`;

    let unit = byPoolKey.get(key);
    if (!unit) {
      unit = {
        label: groupValue,
        classes: [],
        ribbonPlaces: cls.ribbonPlaces,
        ribbonColors: cls.ribbonColors,
        pooled: true,
      };
      byPoolKey.set(key, unit);
      units.push(unit);
    }

    unit.classes.push(cls);
    unit.ribbonPlaces = Math.max(unit.ribbonPlaces, cls.ribbonPlaces);
    unit.ribbonColors ??= cls.ribbonColors;
  }

  return units;
}

/** Percentage first, then collective total. A missing ctot cannot break a tie. */
function pctThenCtotDesc(a: AwardEntry, b: AwardEntry): number {
  const aPct = a.pct ?? 0;
  const bPct = b.pct ?? 0;
  if (bPct !== aPct) return bPct - aPct;
  if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
  return 0;
}

export interface RankedEntry extends AwardEntry {
  /** Zero-based standard competition rank — see withSharedRank. */
  rank: number;
}

/**
 * Standard competition ranking: ties share a rank and the next rider skips.
 *
 * Two tied for first both get rank 0 and the next rider gets rank 2 — "3rd",
 * never "2nd". Callers must then filter by `rank < ribbonPlaces` rather than
 * taking a fixed number of rows; see placeUnit.
 */
function withSharedRank(rows: AwardEntry[]): RankedEntry[] {
  const ranked: RankedEntry[] = [];
  let rank = 0;

  for (const [i, row] of rows.entries()) {
    const prev = ranked[i - 1];
    if (prev) {
      const stillTied =
        row.pct === prev.pct &&
        (row.ctot == null || prev.ctot == null ? true : row.ctot === prev.ctot);
      if (!stillTied) rank = i;
    }
    ranked.push({ ...row, rank });
  }

  return ranked;
}

export interface PlacingGroup {
  /** The rider division this group is for, or null when not split. */
  division: string | null;
  rows: RankedEntry[];
}

/**
 * Ranks one award unit, honouring the By Test / By Division toggle.
 *
 * By Division splits the unit by the rider's own division and ranks each
 * separately — a Junior is not competing against an Open rider for the same
 * ribbon. By Test ranks everyone in the unit together.
 *
 * The legacy carried a note worth keeping: this toggle was once stored and
 * never consulted, so placings always split by division whenever more than one
 * was present, regardless of what the organizer picked.
 */
export function unitPlacings(unit: AwardUnit, awardsByDivision: boolean): PlacingGroup[] {
  const rows: AwardEntry[] = [];
  for (const cls of unit.classes) {
    for (const entry of cls.entries) {
      // Unscored rides are not placed — a class still being judged shows the
      // places decided so far rather than an order invented from entry numbers.
      if (entry.pct == null) continue;
      rows.push(entry);
    }
  }

  if (awardsByDivision) {
    const byDivision = new Map<string, AwardEntry[]>();
    for (const row of rows) {
      const key = divisionLabel(row.division);
      byDivision.set(key, [...(byDivision.get(key) ?? []), row]);
    }

    return DIVISION_ORDER.filter((d) => byDivision.has(d)).map((d) => ({
      division: d,
      rows: withSharedRank([...(byDivision.get(d) ?? [])].sort(pctThenCtotDesc)),
    }));
  }

  if (rows.length === 0) return [];
  return [{ division: null, rows: withSharedRank([...rows].sort(pctThenCtotDesc)) }];
}

export interface AwardSection {
  title: string;
  rows: RankedEntry[];
  colors: RibbonColor[] | null;
}

export interface AwardLevel {
  level: string;
  sections: AwardSection[];
  /**
   * How many classes sit under this level.
   *
   * Counted here rather than off `sections.length`, which is not the same
   * number in either direction: pooling folds several classes into one
   * section, and the By Division split turns one class into a section per
   * division. Reading a count off the sections would tell an organizer with
   * five pooled Training Level tests that the level has one class.
   */
  classCount: number;
}

export interface AwardsReport {
  levels: AwardLevel[];
  /** Ribbon colour name → how many to bring. */
  tally: Record<string, number>;
  /** The most places any one unit awards, which sets the legend's length. */
  maxPlaces: number;
}

/**
 * The whole report: levels → award units → placing groups.
 *
 * One function so the screen and the printed sheet cannot disagree — the live
 * page IS the report, not a preview of it.
 */
export function buildAwardsReport(
  classes: AwardClassInput[],
  awardsByDivision: boolean
): AwardsReport {
  const byLevel = new Map<string, AwardClassInput[]>();
  for (const cls of classes) {
    const level = disciplineOf(cls.label);
    byLevel.set(level, [...(byLevel.get(level) ?? []), cls]);
  }

  const tally: Record<string, number> = {};
  const levels: AwardLevel[] = [];
  let maxPlaces = 0;

  for (const [level, list] of byLevel) {
    const sections: AwardSection[] = [];

    for (const unit of awardUnitsFor(list)) {
      maxPlaces = Math.max(maxPlaces, unit.ribbonPlaces);
      const groups = unitPlacings(unit, awardsByDivision);

      for (const group of groups) {
        if (group.rows.length === 0) continue;

        const base = unit.pooled
          ? `${unit.label} (combined — ${String(unit.classes.length)} classes)`
          : unit.label;
        const title =
          groups.length > 1
            ? `${base} — ${DIVISION_FULL[group.division ?? 'O'] ?? group.division ?? ''}`
            : base;

        /**
         * Filtered by rank, never sliced to a row count.
         *
         * Slicing drops whichever rider tied for the last awarded place
         * happened to sort later — they earned the ribbon and would not get
         * one. The legacy fixed exactly this bug; filtering keeps every tied
         * rider at the cut.
         */
        const rows = group.rows.filter((r) => r.rank < unit.ribbonPlaces);

        for (const row of rows) {
          const ribbon = ribbonFor(row.rank, unit.ribbonColors);
          tally[ribbon.name] = (tally[ribbon.name] ?? 0) + 1;
        }

        sections.push({ title, rows, colors: unit.ribbonColors });
      }
    }

    if (sections.length > 0) levels.push({ level, sections, classCount: list.length });
  }

  return { levels, tally, maxPlaces };
}
