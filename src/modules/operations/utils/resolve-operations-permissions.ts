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
 * same merge logic. Postgres RLS remains the real security boundary; this
 * only decides which panels render — specifically the Vendors tab, gated on
 * `canViewMoney` exactly as the legacy `/api/shows/:id/vendors` endpoint
 * gated it server-side.
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
