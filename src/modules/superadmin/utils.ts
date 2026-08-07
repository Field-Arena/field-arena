import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';

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
