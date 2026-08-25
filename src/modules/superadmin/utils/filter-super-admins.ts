import type { PlatformAccount } from '@/modules/superadmin/types';

export function filterSuperAdmins(accounts: PlatformAccount[]): PlatformAccount[] {
  return accounts.filter((account) => account.role === 'SuperAdmin');
}
