import type { Metadata } from 'next';
import {
  listPlatformAccounts,
  listOrganizerStaffDirectory,
} from '@/modules/superadmin/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { UsersTabs } from '@/modules/superadmin/ui/users-tabs';
import { SuperAdminsPanel } from '@/modules/superadmin/ui/super-admins-panel';
import { DirectoryPanel } from '@/modules/superadmin/ui/directory-panel';
import { filterSuperAdmins } from '@/modules/superadmin/utils/filter-super-admins';

export const metadata: Metadata = {
  title: 'Users — SuperAdmin Console',
};

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; tab?: string }>;
}) {
  const { org, tab } = await searchParams;
  const [accounts, organizers, profile] = await Promise.all([
    listPlatformAccounts(),
    listOrganizerStaffDirectory(),
    getStaffProfile(),
  ]);

  const superAdmins = filterSuperAdmins(accounts);

  return (
    <div className="space-y-7">
      <div className="max-w-[640px]">
        <div className="text-gold mb-3 text-[10.5px] font-bold tracking-[0.18em] uppercase">
          Access
        </div>
        <h1 className="text-hunter-deep mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.022em]">
          Users
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.6]">
          Every real login on the platform — Super Admin staff, and every organizer&apos;s own team
          across every show they run.
        </p>
      </div>

      <UsersTabs
        // Arriving from an organizer's own page opens straight onto their team,
        // already expanded — legacy's "View X's staff →" shortcut.
        initialTab={org || tab === 'directory' ? 'directory' : undefined}
        superAdmins={<SuperAdminsPanel accounts={superAdmins} currentUserId={profile?.id ?? ''} />}
        directory={<DirectoryPanel organizers={organizers} expandedOrgId={org ?? null} />}
      />
    </div>
  );
}
