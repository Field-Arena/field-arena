import type { Metadata } from 'next';
import { House, CalendarDays, Users, Bell } from 'lucide-react';
import { listOrganizations } from '@/modules/superadmin/data/queries';
import { OrganizationsTable } from '@/modules/superadmin/ui/organizations-table';
import { AddOrganizerDialog } from '@/modules/superadmin/ui/add-organizer-dialog';
import { ConsoleStatBar } from '@/modules/superadmin/ui/console-stat-bar';
import { OrganizerStatusFilter } from '@/modules/superadmin/ui/organizer-status-filter';
import {
  summarizeOrganizations,
  isActiveOrganization,
} from '@/modules/superadmin/utils/summarize-organizations';
import { ResendAllPendingInvites } from '@/modules/superadmin/ui/resend-all-pending-invites';
import type { OrganizerStatusKey } from '@/modules/superadmin/ui/organizer-status-filter';

export const metadata: Metadata = {
  title: 'Organizers — SuperAdmin Console',
};

export default async function SuperAdminOrganizersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const everything = await listOrganizations();

  // Soft-deleted and demo organizations are out of every default view, exactly
  // as the legacy console filtered them — they stay reachable via their own
  // filter tabs so a deleted organizer can still be restored.
  const all = everything.filter(isActiveOrganization);

  const query = q?.trim().toLowerCase();
  const matchesQuery = (org: (typeof everything)[number]) =>
    !query ||
    [org.name, org.city, org.region].some((field) => (field ?? '').toLowerCase().includes(query));

  const { onboarded, pending, totalShows, totalRiders, withShows } = summarizeOrganizations(all);

  const STATUS_KEYS: OrganizerStatusKey[] = ['all', 'onboard', 'pending', 'deleted', 'demo'];
  const activeStatus: OrganizerStatusKey =
    status && (STATUS_KEYS as string[]).includes(status) ? (status as OrganizerStatusKey) : 'all';

  const scoped =
    activeStatus === 'deleted'
      ? everything.filter((org) => org.deletedAt !== null)
      : activeStatus === 'demo'
        ? everything.filter((org) => org.isDemo)
        : activeStatus === 'onboard'
          ? all.filter((org) => org.onboarded)
          : activeStatus === 'pending'
            ? all.filter((org) => !org.onboarded)
            : all;

  const organizations = scoped.filter(matchesQuery);
  const pendingOrganizers = all.filter((org) => !org.onboarded).length;

  return (
    <div>
      <div className="fa-page-head">
        <div className="max-w-[640px]">
          <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
            Clients — Organizers
          </h1>
          <p className="m-0 text-[14.5px] leading-[1.6] text-[#475467]">
            Your organizers are the platform&rsquo;s clients. Enter any one of them to work exactly
            as they do &mdash; switch back from the top bar at any time.
          </p>
        </div>
        <div className="fa-head-actions">
          <AddOrganizerDialog />
        </div>
      </div>

      <ConsoleStatBar
        stats={[
          {
            label: 'Organizers',
            value: all.length,
            note: `${String(onboarded)} onboard · ${String(pending)} pending`,
            tone: 'positive',
            icon: House,
            iconTone: 'green',
          },
          {
            label: 'Shows built',
            value: totalShows,
            note: `across ${String(withShows)} ${withShows === 1 ? 'organizer' : 'organizers'}`,
            icon: CalendarDays,
            iconTone: 'blue',
          },
          {
            label: 'Riders entered',
            value: totalRiders,
            note: totalRiders === 0 ? 'no entries open yet' : 'across every open show',
            icon: Users,
            iconTone: 'purple',
          },
          {
            label: 'Needs attention',
            value: pending,
            note: pending === 0 ? 'every invite accepted' : 'invites unopened',
            tone: pending === 0 ? undefined : 'warn',
            icon: Bell,
            iconTone: 'amber',
          },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <OrganizerStatusFilter
          active={activeStatus}
          counts={{
            all: all.length,
            onboard: onboarded,
            pending,
            deleted: everything.filter((org) => org.deletedAt !== null).length,
            demo: everything.filter((org) => org.isDemo).length,
          }}
          q={q}
        />
        <ResendAllPendingInvites pendingCount={pendingOrganizers} />
        <span className="text-[12.5px] text-[#8A94A3]">
          Showing {organizations.length} of {all.length} organizers
          {q && ` matching “${q}”`}
        </span>
      </div>

      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
