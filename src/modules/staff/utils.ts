import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';
import { USER_ROLE_RANK } from './constants';

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

export function roleRank(role: string): number {
  const i = (USER_ROLE_RANK as readonly string[]).indexOf(role);
  return i === -1 ? 99 : i;
}

export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

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
    idx = {
      first: find('first'),
      last: find('last'),
      name: find('name'),
      role: find('role'),
      phone: find('phone'),
      email: find('email'),
    };
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

function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildStaffCsv(
  rows: {
    firstName: string;
    lastName: string;
    role: string;
    phone: string | null;
    email: string | null;
  }[],
): string {
  const header = 'First name,Last name,Role,Phone,Email\n';
  const body = rows
    .map((r) =>
      [
        escapeCsvField(r.firstName),
        escapeCsvField(r.lastName),
        escapeCsvField(r.role),
        escapeCsvField(r.phone),
        escapeCsvField(r.email),
      ].join(','),
    )
    .join('\n');
  return header + body + (rows.length > 0 ? '\n' : '');
}

export function staffCsvFilename(showName: string): string {
  const slug = showName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `field-and-arena-staff-${slug || 'show'}.csv`;
}
