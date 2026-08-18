import type { PlatformAccount } from '@/modules/superadmin/types';

/**
 * Narrows the platform account list to Super Admins only — the first Users tab
 * (BUG-USERS-002; matches the legacy console's split, where every other login
 * belongs to an organizer's team and shows in the Organizer Staff Directory tab
 * instead).
 */
export function filterSuperAdmins(accounts: PlatformAccount[]): PlatformAccount[] {
  return accounts.filter((account) => account.role === 'SuperAdmin');
}
