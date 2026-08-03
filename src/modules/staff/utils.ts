import { PERMISSION_KEYS, ROLE_PERMISSION_DEFAULTS, type PermissionKey } from '@/shared/constants/permissions';
import { USER_ROLE_RANK } from './constants';

/**
 * Resolves a staff_assignments row's effective permissions: role defaults,
 * then the two legacy single-flag columns, then the explicit per-person
 * `permissions` jsonb — always wins. Mirrors `has_show_permission()` in the
 * RLS migration and `resolveStaffPermissions` in
 * `modules/superadmin/utils.ts`; reimplemented locally rather than imported
 * because a module may not reach into another module's internals. Postgres
 * remains the actual security boundary — this only decides which boxes a
 * permission editor shows checked.
 */
export function resolveStaffPermissions(input: {
  role: string;
  permissions: unknown;
  canScratchSkipDq?: boolean | null;
  canViewMoney?: boolean | null;
}): Record<PermissionKey, boolean> {
  const resolved = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) resolved[key] = false;

  const defaults = ROLE_PERMISSION_DEFAULTS[input.role] ?? {};
  for (const key of PERMISSION_KEYS) {
    if (defaults[key]) resolved[key] = true;
  }

  if (input.canScratchSkipDq) {
    resolved.canScratch = true;
    resolved.canSkip = true;
    resolved.canEliminate = true;
  }
  if (input.canViewMoney) {
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

/** Sort rank for the "All Users" directory — see USER_ROLE_RANK's own doc comment. */
export function roleRank(role: string): number {
  const i = (USER_ROLE_RANK as readonly string[]).indexOf(role);
  return i === -1 ? 99 : i;
}

/** Splits a single display name into first/last, the same naive way the legacy `splitName` did. */
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

/**
 * Normalizes a free-text CSV "role" cell to one of this app's grantable
 * roles, ported from showstaff.html's `normRole()`. Org-level words
 * (super/organizer/admin) all collapse to 'Show Admin' — CSV import cannot
 * self-serve grant an org-wide role — and 'volunteer' maps to 'ShowStaff'.
 */
export function normalizeCsvRole(raw: string): string {
  const r = raw.toLowerCase().trim();
  if (r.includes('super')) return 'Show Admin';
  if (r.includes('organiz')) return 'Show Admin';
  if (r.includes('admin')) return 'Show Admin';
  if (r.includes('judge')) return 'Judge';
  if (r.includes('scrib')) return 'Scribe';
  if (r.includes('announc')) return 'Announcer';
  if (r.includes('vendor')) return 'Vendor';
  if (r.includes('showstaff') || r.includes('show staff')) return 'ShowStaff';
  if (r.includes('volunt')) return 'ShowStaff';
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : 'ShowStaff';
}

export interface ParsedStaffCsvRow {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
}

/**
 * A simple, header-aware CSV parser for staff-list uploads, ported from
 * showstaff.html's `parseStaffCsv`. If the first line looks like a header
 * (mentions first/last/name/role/email/phone), columns are located by
 * substring match on the lowercased header names; otherwise it falls back to
 * the template's fixed column order (name, role, phone, email — no separate
 * first/last).
 *
 * Deliberately not full RFC4180: a `"…"` quoted field survives a comma inside
 * it (the common Excel-export case) but embedded newlines inside a quoted
 * field do not, matching the legacy parser's own limitation.
 */
export function parseStaffCsv(text: string): ParsedStaffCsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headerLine = lines[0] ?? '';
  const looksLikeHeader = /first|last|name|role|email|phone/i.test(headerLine);

  let start = 0;
  let idx = { first: -1, last: -1, name: 0, role: 1, phone: 2, email: 3 };

  if (looksLikeHeader) {
    const cols = splitCsvLine(headerLine).map((c) => c.toLowerCase());
    const find = (k: string) => cols.findIndex((c) => c.includes(k));
    idx = { first: find('first'), last: find('last'), name: find('name'), role: find('role'), phone: find('phone'), email: find('email') };
    start = 1;
  }

  const out: ParsedStaffCsvRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i] ?? '');
    const emailCell = idx.email >= 0 ? (cols[idx.email] ?? '') : '';
    if (!emailCell.trim()) continue;

    let firstName = '';
    let lastName = '';
    if (idx.first >= 0 || idx.last >= 0) {
      firstName = (idx.first >= 0 ? cols[idx.first] : '') ?? '';
      lastName = (idx.last >= 0 ? cols[idx.last] : '') ?? '';
    } else {
      const nameCell = (idx.name >= 0 ? cols[idx.name] : '') ?? '';
      const split = splitName(nameCell);
      firstName = split.first;
      lastName = split.last;
    }

    out.push({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: normalizeCsvRole((idx.role >= 0 ? cols[idx.role] : '') ?? ''),
      phone: ((idx.phone >= 0 ? cols[idx.phone] : '') ?? '').trim(),
      email: emailCell.trim().toLowerCase(),
    });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  return line.split(',').map((s) => s.replace(/^"|"$/g, '').trim());
}

/** CSV field escaping — wraps in quotes (doubling any inner quote) only when the field needs it. */
function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Builds the "Export Staff List" CSV — one show's staff only, matching
 * showstaff.html's `exportStaffCsv`: same five columns as the upload
 * template, in the same order.
 */
export function buildStaffCsv(rows: { firstName: string; lastName: string; role: string; phone: string | null; email: string | null }[]): string {
  const header = 'First name,Last name,Role,Phone,Email\n';
  const body = rows
    .map((r) => [escapeCsvField(r.firstName), escapeCsvField(r.lastName), escapeCsvField(r.role), escapeCsvField(r.phone), escapeCsvField(r.email)].join(','))
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}

/** Slugified filename, matching the legacy `field-and-arena-staff-<show>.csv` pattern. */
export function staffCsvFilename(showName: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-staff-${slug || 'show'}.csv`;
}
