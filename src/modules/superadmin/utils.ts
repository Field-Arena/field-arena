import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';
import type {
  OrganizationSummary,
  LeadRow,
  CatalogSheetRow,
  TestSheetItem,
  PlatformAccount,
} from './types';
import type { ChecklistItem, MovementItem, CollectiveItem } from './schemas';

/**
 * Resolve a staff member's effective permissions.
 *
 * A pure TypeScript port of public.has_show_permission() in the RLS migration,
 * with the same load-bearing merge order:
 *   1. every key false
 *   2. role defaults
 *   3. the two legacy single-flag columns (can_scratch_skip_dq, can_view_money)
 *   4. the explicit per-person `permissions` jsonb — always wins
 *
 * Postgres remains the security boundary; this only decides which boxes the
 * permission editor shows checked. If the two ever disagree the database wins.
 */
export function resolveStaffPermissions(input: {
  role: string;
  permissions: unknown;
  can_scratch_skip_dq?: boolean | null;
  can_view_money?: boolean | null;
}): Record<PermissionKey, boolean> {
  const resolved = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) resolved[key] = false;

  const defaults = ROLE_PERMISSION_DEFAULTS[input.role] ?? {};
  for (const key of PERMISSION_KEYS) {
    if (defaults[key]) resolved[key] = true;
  }

  if (input.can_scratch_skip_dq) {
    resolved.canScratch = true;
    resolved.canSkip = true;
    resolved.canEliminate = true;
  }
  if (input.can_view_money) {
    resolved.canViewMoney = true;
  }

  if (input.permissions && typeof input.permissions === 'object') {
    const explicit = input.permissions as Record<string, unknown>;
    for (const key of PERMISSION_KEYS) {
      if (typeof explicit[key] === 'boolean') resolved[key] = explicit[key];
    }
  }

  return resolved;
}

/** How many of the resolved permissions are enabled — the "X/N" pill count. */
export function countEnabledPermissions(resolved: Record<PermissionKey, boolean>): number {
  return PERMISSION_KEYS.reduce((count, key) => count + (resolved[key] ? 1 : 0), 0);
}

/** CSV field escaping — wraps in quotes (doubling any inner quote) only when the field needs it. Matches modules/staff/utils.ts's identical helper. */
function escapeCsvField(value: string | number | null | undefined): string {
  const v = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Builds the Sales Funnel "Export Contact List" CSV — every target currently
 * matching the board's search box, same columns as the visible table
 * (Organization, Contact, Email, Shows/yr, Status), so what downloads is
 * exactly what was on screen when the button was clicked.
 */
export function buildLeadsCsv(
  leads: {
    org: string;
    contact: string | null;
    email: string | null;
    shows: number | null;
    status: string | null;
  }[],
): string {
  const header = 'Organization,Contact,Email,Shows/yr,Status\n';
  const body = leads
    .map((l) =>
      [
        escapeCsvField(l.org),
        escapeCsvField(l.contact),
        escapeCsvField(l.email),
        escapeCsvField(l.shows),
        escapeCsvField(l.status),
      ].join(','),
    )
    .join('\n');
  return header + body + (leads.length > 0 ? '\n' : '');
}

export function leadsCsvFilename(): string {
  return 'field-and-arena-sales-funnel-contacts.csv';
}

// ── Organizers overview ──────────────────────────────────────────────────────

export interface OrganizationsSummaryStats {
  onboarded: number;
  pending: number;
  totalShows: number;
  totalRiders: number;
  withShows: number;
}

/**
 * The "Clients — Organizers" overview page's stat-bar figures, derived from the
 * full (unfiltered) organization list so they always describe the platform, not
 * whatever the search/status filter currently narrows the table to.
 */
export function summarizeOrganizations(orgs: OrganizationSummary[]): OrganizationsSummaryStats {
  const onboarded = orgs.filter((org) => org.onboarded).length;
  return {
    onboarded,
    pending: orgs.length - onboarded,
    totalShows: orgs.reduce((sum, org) => sum + org.showCount, 0),
    totalRiders: orgs.reduce((sum, org) => sum + org.riderCount, 0),
    withShows: orgs.filter((org) => org.showCount > 0).length,
  };
}

// ── Sales funnel ──────────────────────────────────────────────────────────────

export interface LeadFunnelSummary {
  counts: Record<string, number>;
  /**
   * Of the leads that reached a real outcome (demo done, onboarding, won, or
   * lost), how many became customers. New and demo-scheduled are excluded — they
   * have not had a real chance yet. Matches the legacy formula exactly. `null`
   * when nothing has resolved yet.
   */
  closingRate: number | null;
}

export function summarizeLeadFunnel(leads: LeadRow[]): LeadFunnelSummary {
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const key = lead.status ?? 'new';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const resolved =
    (counts.demo_completed ?? 0) +
    (counts.onboarding ?? 0) +
    (counts.customer ?? 0) +
    (counts.lost ?? 0);
  const closingRate = resolved ? Math.round(((counts.customer ?? 0) / resolved) * 100) : null;

  return { counts, closingRate };
}

// ── Scoring catalog ───────────────────────────────────────────────────────────

export interface SheetsByFamilySummary {
  byFamily: Map<string, number>;
  /** Sheets with no source PDF attached yet. */
  stubs: number;
}

/** Groups the catalog by scoring family for the platform-library stat tiles. */
export function groupSheetsByFamily(sheets: CatalogSheetRow[]): SheetsByFamilySummary {
  const byFamily = new Map<string, number>();
  for (const sheet of sheets) {
    const family = sheet.family ?? 'unassigned';
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
  }
  const stubs = sheets.filter((s) => !s.source_file).length;
  return { byFamily, stubs };
}

/**
 * Narrows the catalog to sheets with an official source file and reshapes them
 * for the Documents board's Tests tab, which matches uploads to sheets by name.
 */
export function toTestSheetItems(sheets: CatalogSheetRow[]): TestSheetItem[] {
  return sheets
    .filter((s) => s.source_file)
    .map((s) => ({ id: s.id, title: s.title, level: s.level, sourceFile: s.source_file ?? '' }));
}

/**
 * The `def` jsonb, coerced into the shape the sheet editor's form fields bind
 * to — strings for every text input (even numeric ones, so an empty field
 * round-trips as `''` rather than `'0'` or `'NaN'`), and typed movement/
 * collective arrays.
 */
export interface SheetDefShape {
  arena: string;
  rideTime: string;
  maxPoints: string;
  intro: string;
  errorScheduleText: string;
  movements: MovementItem[];
  collectives: CollectiveItem[];
}

export function readSheetDef(raw: unknown): SheetDefShape {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return '';
  };
  const movements: MovementItem[] = Array.isArray(d.movements)
    ? d.movements.map((m, i) => {
        const mv = (m ?? {}) as Record<string, unknown>;
        return {
          n: typeof mv.n === 'number' ? mv.n : i + 1,
          text: str(mv.text),
          coef: typeof mv.coef === 'number' ? mv.coef : 1,
        };
      })
    : [];
  const collectives: CollectiveItem[] = Array.isArray(d.collectives)
    ? d.collectives.map((c) => {
        const cm = (c ?? {}) as Record<string, unknown>;
        return {
          name: str(cm.name ?? cm.label),
          coef: typeof cm.coef === 'number' ? cm.coef : 1,
        };
      })
    : [];
  return {
    arena: str(d.arena),
    rideTime: str(d.rideTime),
    maxPoints: d.maxPoints == null ? '' : str(d.maxPoints),
    intro: str(d.intro),
    errorScheduleText: str(d.errorScheduleText),
    movements,
    collectives,
  };
}

// ── Documents / file store ────────────────────────────────────────────────────

/** Strips extension, years, and punctuation so bulk uploads match by filename. */
export function normalizeFilename(s: string): string {
  return s
    .replace(/\.[^.]+$/, '')
    .replace(/(19|20)\d{2}/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

/** Reads a File into base64 for the upload Server Action, which takes bytes as a string. */
export function readFileAsBase64(file: File): Promise<{ dataBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({ dataBase64: result.split(',')[1] ?? '', contentType: file.type || 'application/pdf' });
    };
    reader.onerror = () => {
      reject(new Error('Could not read the file'));
    };
    reader.readAsDataURL(file);
  });
}

// ── Users ──────────────────────────────────────────────────────────────────────

/**
 * Narrows the platform account list to Super Admins only — the first Users tab
 * (BUG-USERS-002; matches the legacy console's split, where every other login
 * belongs to an organizer's team and shows in the Organizer Staff Directory tab
 * instead).
 */
export function filterSuperAdmins(accounts: PlatformAccount[]): PlatformAccount[] {
  return accounts.filter((account) => account.role === 'SuperAdmin');
}

// ── Sales funnel (lead) detail ─────────────────────────────────────────────────

/** Reads a numeric field back to a plain number, or null if blank/garbage. */
export function parseMoneyField(value: string): number | null {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && value.trim() ? n : null;
}

/** Narrows the lead's `onboarding_checklist` jsonb down to well-formed checklist items. */
export function toChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is ChecklistItem =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as ChecklistItem).id === 'string' &&
      typeof (x as ChecklistItem).label === 'string'
  );
}
