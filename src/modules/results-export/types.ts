import type { ReadinessItem } from '@/modules/results-export/utils/readiness';
export type ExportFormat = 'csv' | 'xlsx' | 'dat';

export const EXPORT_FORMATS: readonly ExportFormat[] = ['csv', 'xlsx', 'dat'];

export function isExportFormat(value: unknown): value is ExportFormat {
  return typeof value === 'string' && (EXPORT_FORMATS as readonly string[]).includes(value);
}

/* A cell is text, a real number (so Excel stores it as a number), or empty. */
export type Cell = string | number | null;

export interface ExportJudge {
  seatId: string;
  firstName: string;
  lastName: string;
  usefId: string | null;
}

export interface ExportPerson {
  firstName: string | null;
  lastName: string | null;
  /** A single free-text name, used when first and last are not on file. */
  fallbackName: string | null;
  usef: string | null;
  noUsefReason: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  email: string | null;
}

export interface ExportEntry {
  classId: string;
  /** Stable identity of the rider / horse, so the checklist counts each once. */
  riderKey: string;
  horseKey: string;
  /** Back / bridle number. */
  num: string | null;
  /** class_entries.status: scheduled, scored, scratched or disqualified. */
  status: string | null;
  /** class_entries.final_pct: a number as text, or 'SCR' / 'ELIM'. */
  finalPct: string | null;
  /** Placing computed by the same rule the results screen uses. */
  rank: number | null;
  /** Final percentage as a number, when there is one. */
  pct: number | null;
  /** J, Y, A or O: the rider's division on this ride. */
  riderDivision: string | null;
  /** Percentage each judge gave, keyed by seat id. */
  judgePct: Record<string, number>;
  /** Test ridden, for a Test of Choice class. */
  testName: string | null;
  /** Maximum points for the test this entry rode; null when unknown. */
  maxPoints: number | null;
  rider: ExportPerson;
  horse: {
    name: string | null;
    usef: string | null;
    passport: string | null;
    fei: string | null;
    registration: string | null;
    yearOfBirth: string | null;
    breed: string | null;
  };
  owner: ExportPerson;
  trainer: {
    name: string | null;
    usef: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  /** Rider's USDF number or, failing that, FEI number. */
  riderDisciplineNumber: string | null;
}

export interface ExportClass {
  id: string;
  title: string;
  sectionCode: string | null;
  qualifying: boolean;
  runOrder: number | null;
  date: string | null;
  /** Test or level name for the Dressage Level column. */
  level: string | null;
  judges: ExportJudge[];
}

export interface ExportInput {
  show: { name: string; startDate: string | null; usefCompId: string | null };
  classes: ExportClass[];
  entries: ExportEntry[];
}

export interface ExportBundle {
  header: string[];
  rows: Cell[][];
  /** Things the organizer should know before sending the file to USEF. */
  warnings: string[];
}

export interface PostShowReport {
  showName: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  days: number;
  rings: number;
  classes: number;
  entries: number;
  riders: number;
  horses: number;
  scored: number;
  scratched: number;
  resultsPublished: number;
  revenue: number;
  /** Rows the export will contain. */
  exportRows: number;
  readiness: ReadinessItem[];
}
