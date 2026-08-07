import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';

/**
 * Resolves a staff_assignments row's effective permissions for the ShowStaff
 * operations module. Reimplemented locally rather than imported from
 * `modules/staff/utils.ts` or `modules/scoring/utils.ts` because a module may
 * not reach into another module's internals — this is another copy of the
 * same merge logic (see `modules/scoring/utils.ts`'s doc comment for why two
 * earlier copies already exist). Postgres RLS remains the real security
 * boundary; this only decides which panels render — specifically the Vendors
 * tab, gated on `canViewMoney` exactly as the legacy
 * `/api/shows/:id/vendors` endpoint gated it server-side (a plain ShowStaff
 * reaches the resource but sees nothing without an explicit per-person
 * grant).
 */
export function resolveOperationsPermissions(input: {
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
  if (input.canViewMoney) resolved.canViewMoney = true;

  if (input.permissions && typeof input.permissions === 'object') {
    const explicit = input.permissions as Record<string, unknown>;
    for (const key of PERMISSION_KEYS) {
      if (typeof explicit[key] === 'boolean') resolved[key] = explicit[key];
    }
  }
  return resolved;
}

/**
 * Dressage-style shared ranking: an exact tie shares a place and the next
 * place is skipped (1st, 1st, 3rd — no 2nd), ported from
 * showstaff-ops.html's withSharedRank(). `rows` must already be sorted
 * descending by score. Non-numeric scores (SCR/ELIM) carry `finalPctNum:
 * null` and are expected to have been filtered out by the caller before
 * ranking — a null never ties with anything, including another null, so an
 * unfiltered list would rank them arbitrarily.
 */
export function withSharedRank<T extends { finalPctNum: number | null }>(
  rows: T[]
): (T & { place: number })[] {
  let rank = 1;
  let prev: number | null = null;
  return rows.map((row, i) => {
    if (i > 0 && prev !== row.finalPctNum) rank = i + 1;
    prev = row.finalPctNum;
    return { ...row, place: rank };
  });
}

/**
 * "08:00" (24h, from the `classes.time` column) → "8:00 AM". Falls back to
 * the raw value when it doesn't match — same fallback showstaff-ops.html's
 * own fmtTimeLabel used for a time already stored in a display format.
 */
export function fmtTimeLabel(time: string | null): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const minutes = m[2] ?? '00';
  let h = Number(m[1] ?? '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h)}:${minutes} ${ampm}`;
}

export function classStatusLabel(status: 'upcoming' | 'running' | 'done'): string {
  if (status === 'done') return 'Complete';
  if (status === 'running') return 'Running';
  return 'Upcoming';
}
