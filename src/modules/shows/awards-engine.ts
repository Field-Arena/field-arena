import { ribbonFor, type RibbonColor } from '@/modules/shows/constants';

export const DIVISION_ORDER = ['J', 'Y', 'A', 'O'] as const;

export const DIVISION_FULL: Record<string, string> = {
  J: 'Junior',
  Y: 'Young Rider',
  A: 'Adult Am.',
  O: 'Open',
};

export function divisionLabel(division: string | null): string {
  return DIVISION_ORDER.find((d) => d === division) ?? 'O';
}

export function disciplineOf(name: string): string {
  if (/FEI|Prix|Grand Prix|Intermediate/i.test(name)) return 'FEI';
  const match = /^(.*?Level|Introductory)/.exec(name);
  return match?.[1] ?? name;
}

export interface AwardEntry {
  num: string;
  name: string;
  horse: string;

  pct: number | null;

  ctot: number | null;
  division: string;
}

export interface AwardClassInput {
  id: string;

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

  pooled: boolean;
}

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

function pctThenCtotDesc(a: AwardEntry, b: AwardEntry): number {
  const aPct = a.pct ?? 0;
  const bPct = b.pct ?? 0;
  if (bPct !== aPct) return bPct - aPct;
  if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
  return 0;
}

export interface RankedEntry extends AwardEntry {
  rank: number;
}

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
  division: string | null;
  rows: RankedEntry[];
}

export function unitPlacings(unit: AwardUnit, awardsByDivision: boolean): PlacingGroup[] {
  const rows: AwardEntry[] = [];
  for (const cls of unit.classes) {
    for (const entry of cls.entries) {
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

  classCount: number;
}

export interface AwardsReport {
  levels: AwardLevel[];

  tally: Record<string, number>;

  maxPlaces: number;
}

export function buildAwardsReport(
  classes: AwardClassInput[],
  awardsByDivision: boolean,
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
