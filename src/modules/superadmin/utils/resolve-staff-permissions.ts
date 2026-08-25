import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';

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
