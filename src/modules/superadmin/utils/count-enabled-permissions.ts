import { PERMISSION_KEYS, type PermissionKey } from '@/shared/constants/permissions';

export function countEnabledPermissions(resolved: Record<PermissionKey, boolean>): number {
  return PERMISSION_KEYS.reduce((count, key) => count + (resolved[key] ? 1 : 0), 0);
}
