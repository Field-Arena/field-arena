import { COL, MAX_JUDGES, judgeColumns } from '../columns';
import { USEF_COLUMNS, USEF_COLUMN_COUNT } from '../usef-columns';
import type { Cell, ExportBundle, ExportClass, ExportEntry, ExportInput } from '../types';
import {
  cleanClassTitle,
  clampLength,
  formatLastFirst,
  placingFor,
  pointsFromPct,
  riderStatusFor,
  roundPct,
} from './usef-format';

const orNull = (value: string | null | undefined): string | null => {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
};

/* Class numbers follow the show's running order. USEF wants plain numbers
 * with no leading zeros and never the same number twice. */
export function numberClasses(classes: ExportClass[]): Map<string, number> {
  const ordered = [...classes].sort((a, b) => {
    const ar = a.runOrder ?? Number.POSITIVE_INFINITY;
    const br = b.runOrder ?? Number.POSITIVE_INFINITY;
    if (ar !== br) return ar - br;
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad !== bd) return ad.localeCompare(bd);
    return a.title.localeCompare(b.title);
  });
  return new Map(ordered.map((cls, i) => [cls.id, i + 1]));
}

/* Within a class: placed rides in order, then scored-but-unplaced (0), then
 * letter codes (S, E, DQ), then rides not scored yet; ties by back number. */
function sortKey(entry: ExportEntry): [number, number, number] {
  const placing = placingFor(entry);
  const bib = Number(entry.num);
  const bibKey = Number.isFinite(bib) ? bib : Number.MAX_SAFE_INTEGER;
  if (placing === '') return [3, 0, bibKey];
  const n = Number(placing);
  if (Number.isFinite(n)) return n > 0 ? [0, n, bibKey] : [1, 0, bibKey];
  return [2, 0, bibKey];
}

/* One row per entry per class, in the USEF universal results layout. */
export function buildUsefRows(input: ExportInput): ExportBundle {
  const { show, classes, entries } = input;
  const classNumber = numberClasses(classes);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const compYear = show.startDate?.slice(0, 4) ?? '';

  const entriesByClass = new Map<string, ExportEntry[]>();
  for (const entry of entries) {
    if (!classById.has(entry.classId)) continue;
    const list = entriesByClass.get(entry.classId) ?? [];
    list.push(entry);
    entriesByClass.set(entry.classId, list);
  }

  const rows: Cell[][] = [];
  const orderedClasses = [...classes].sort(
    (a, b) => (classNumber.get(a.id) ?? 0) - (classNumber.get(b.id) ?? 0),
  );

  for (const cls of orderedClasses) {
    const list = [...(entriesByClass.get(cls.id) ?? [])].sort((a, b) => {
      const [ag, ap, ab] = sortKey(a);
      const [bg, bp, bb] = sortKey(b);
      return ag - bg || ap - bp || ab - bb;
    });
    const competed = list.filter(
      (e) => e.status === 'scored' || e.status === 'disqualified' || e.finalPct === 'ELIM',
    ).length;
    const completed = list.filter((e) => e.status === 'scored' && e.pct !== null).length;

    for (const entry of list) {
      const row: Cell[] = new Array<Cell>(USEF_COLUMN_COUNT).fill(null);
      const set = (index: number, value: Cell) => {
        row[index] = value === '' ? null : value;
      };

      set(COL.compYear, compYear ? Number(compYear) : null);
      set(COL.compId, orNull(show.usefCompId));
      set(COL.classNumber, classNumber.get(cls.id) ?? null);
      set(COL.classTitle, cleanClassTitle(cls.title));
      set(COL.sectionCode, orNull(cls.sectionCode));
      set(COL.numEntries, list.length);
      set(COL.qualifier, cls.qualifying ? 'Q' : null);
      set(COL.placing, placingFor(entry));
      const bib = Number(entry.num);
      set(COL.exhibitorNumber, entry.num && Number.isFinite(bib) ? bib : orNull(entry.num));

      set(COL.horseUsef, orNull(entry.horse.usef));
      set(COL.horsePassport, orNull(entry.horse.passport));
      set(COL.horseName, orNull(entry.horse.name));
      set(COL.horseRegistration, orNull(entry.horse.registration));
      set(COL.horseFei, orNull(entry.horse.fei));
      set(COL.horseYearOfBirth, orNull(entry.horse.yearOfBirth));
      set(COL.horseBreed, orNull(entry.horse.breed));

      const r = entry.rider;
      set(COL.riderUsef, orNull(r.usef));
      set(COL.riderNoUsefWhy, r.usef ? null : orNull(r.noUsefReason));
      set(COL.riderName, formatLastFirst(r.firstName, r.lastName, r.fallbackName));
      set(COL.riderStreet, orNull(r.street));
      set(COL.riderCity, orNull(r.city));
      set(COL.riderState, orNull(r.state));
      set(COL.riderZip, orNull(r.zip));
      set(COL.riderDisciplineNumber, orNull(entry.riderDisciplineNumber));
      set(COL.riderEmail, orNull(r.email));

      const o = entry.owner;
      set(COL.ownerUsef, orNull(o.usef));
      set(COL.ownerNoUsefWhy, o.usef ? null : orNull(o.noUsefReason));
      set(COL.ownerName, formatLastFirst(o.firstName, o.lastName, o.fallbackName));
      set(COL.ownerStreet, orNull(o.street));
      set(COL.ownerCity, orNull(o.city));
      set(COL.ownerState, orNull(o.state));
      set(COL.ownerZip, orNull(o.zip));
      set(COL.ownerEmail, orNull(o.email));

      const t = entry.trainer;
      set(COL.trainerUsef, orNull(t.usef));
      set(COL.trainerName, formatLastFirst(null, null, t.name));
      set(COL.trainerStreet, orNull(t.street));
      set(COL.trainerCity, orNull(t.city));
      set(COL.trainerState, orNull(t.state));
      set(COL.trainerZip, orNull(t.zip));

      cls.judges.slice(0, MAX_JUDGES).forEach((judge, i) => {
        const c = judgeColumns(i);
        set(c.first, orNull(judge.firstName));
        set(c.last, orNull(judge.lastName));
        set(c.usefId, orNull(judge.usefId));
        const judgePct = entry.judgePct[judge.seatId];
        if (typeof judgePct === 'number' && Number.isFinite(judgePct)) {
          set(c.pct, roundPct(judgePct));
          if (entry.maxPoints) set(c.score, pointsFromPct(judgePct, entry.maxPoints));
        }
      });

      if (entry.pct !== null) {
        set(COL.dressageTotalPercentage, roundPct(entry.pct));
        if (entry.maxPoints) set(COL.dressageTotalScore, pointsFromPct(entry.pct, entry.maxPoints));
      }
      set(COL.dressageLevel, orNull(entry.testName ?? cls.level));
      set(COL.dressageRiderStatus, riderStatusFor(entry.riderDivision));
      set(COL.numberCompeted, competed);
      set(COL.numberCompleted, completed);

      rows.push(
        row.map((value, index) => clampLength(value, USEF_COLUMNS[index]?.maxLength ?? null)),
      );
    }
  }

  return {
    header: USEF_COLUMNS.map((c) => c.header),
    rows,
    warnings: collectWarnings(input, classNumber),
  };
}

function collectWarnings(input: ExportInput, classNumber: Map<string, number>): string[] {
  const warnings: string[] = [];
  const { show, classes, entries } = input;
  if (!orNull(show.usefCompId)) {
    warnings.push(
      'This show has no USEF competition ID. Add it in Show Setup before sending to USEF.',
    );
  }
  const classesWithRides = new Set(entries.map((e) => e.classId));
  const noCode = classes.filter((c) => classesWithRides.has(c.id) && !orNull(c.sectionCode));
  if (noCode.length > 0) {
    const names = noCode
      .sort((a, b) => (classNumber.get(a.id) ?? 0) - (classNumber.get(b.id) ?? 0))
      .map((c) => c.title);
    warnings.push(
      `${String(noCode.length)} class${noCode.length === 1 ? ' has' : 'es have'} no USEF section code: ${names.join('; ')}.`,
    );
  }
  const unscored = entries.filter((e) => placingFor(e) === '').length;
  if (unscored > 0) {
    warnings.push(
      `${String(unscored)} ride${unscored === 1 ? ' has' : 's have'} not been scored yet, so no placing is exported for ${unscored === 1 ? 'it' : 'them'}.`,
    );
  }
  const noRiderUsef = entries.filter(
    (e) => !orNull(e.rider.usef) && !orNull(e.rider.noUsefReason),
  ).length;
  if (noRiderUsef > 0) {
    warnings.push(
      `${String(noRiderUsef)} rider${noRiderUsef === 1 ? ' has' : 's have'} no USEF number and no reason given.`,
    );
  }
  return warnings;
}
