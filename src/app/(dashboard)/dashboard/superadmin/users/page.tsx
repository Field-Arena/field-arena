import type { Metadata } from 'next';
import {
  listPlatformAccounts,
  listOrganizerStaffDirectory,
} from '@/modules/superadmin/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { UsersTabs } from '@/modules/superadmin/ui/users-tabs';
import { SuperAdminsPanel } from '@/modules/superadmin/ui/super-admins-panel';
import { DirectoryPanel } from '@/modules/superadmin/ui/directory-panel';

export const metadata: Metadata = {
  title: 'Users — SuperAdmin Console',
};

/**
 * The SuperAdmin Users page: two tabs, matching the legacy console.
 *
 *  - Super Admins — platform owners, add/remove.
 *  - Organizer Staff Directory — every organizer's team across their shows.
 *
 * Both datasets are read here in the Server Component and handed to the tab
 * panels as props; the tabs themselves are the only client piece.
 */
export default async function PlatformUsersPage() {
  const [accounts, organizers, profile] = await Promise.all([
    listPlatformAccounts(),
    listOrganizerStaffDirectory(),
    getStaffProfile(),
  ]);

  // The "Super Admins" tab lists Super Admins only — every other login belongs
  // to an organizer's team and shows in the Organizer Staff Directory tab
  // (BUG-USERS-002; matches the legacy console's split).
  const superAdmins = accounts.filter((account) => account.role === 'SuperAdmin');

  return (
    <div className="space-y-7">
      <div className="max-w-[640px]">
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">
          Access
        </div>
        <h1 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep">
          Users
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
          Every real login on the platform — Super Admin staff, and every organizer&apos;s own team
          across every show they run.
        </p>
      </div>

      <UsersTabs
        superAdmins={
          <SuperAdminsPanel accounts={superAdmins} currentUserId={profile?.id ?? ''} />
        }
        directory={<DirectoryPanel organizers={organizers} />}
      />
    </div>
  );
}
