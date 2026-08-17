import type { Metadata } from 'next';
import { House, CalendarDays, Users, Bell } from 'lucide-react';
import { listOrganizations } from '@/modules/superadmin/data/queries';
import { OrganizationsTable } from '@/modules/superadmin/ui/organizations-table';
import { ConsoleStatBar } from '@/modules/superadmin/ui/console-stat-bar';
import { OrganizerStatusFilter } from '@/modules/superadmin/ui/organizer-status-filter';
import { summarizeOrganizations } from '@/modules/superadmin/utils';

export const metadata: Metadata = {
  title: 'Super Admin — Field & Arena',
};

/**
 * "Clients — Organizers": the view the console opens on.
 *
 * The numbers are real rows, where the legacy console's were a hardcoded
 * client-side array.
 */
export default async function SuperAdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const all = await listOrganizations();

  // Filtered here rather than in the database: the organizer list is small and
  // already fetched in full for the totals, so a second round trip per keystroke
  // would cost more than it saves. Name and location both match, since an
  // organizer is often looked up by the town a show runs in.
  const query = q?.trim().toLowerCase();
  const searched = query
    ? all.filter((org) =>
        [org.name, org.city, org.region].some((field) =>
          (field ?? '').toLowerCase().includes(query)
        )
      )
    : all;

  // Totals describe the platform, so they always reflect every organization —
  // narrowing them to the current search would make them read as platform
  // figures while silently meaning something else.
  const { onboarded, pending, totalShows, totalRiders, withShows } = summarizeOrganizations(all);

  // The status filter narrows what the table shows, on top of whatever the
  // search box already narrowed — so a search plus "Pending" combine rather
  // than reset each other.
  const activeStatus = status === 'onboard' || status === 'pending' ? status : 'all';
  const organizations =
    activeStatus === 'all'
      ? searched
      : searched.filter((org) => (activeStatus === 'onboard' ? org.onboarded : !org.onboarded));

  return (
    <div>
      <div className="mb-[30px] max-w-[640px]">
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
          Command center
        </div>
        <h1 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-forest">
          Clients — Organizers
        </h1>
        <p className="m-0 text-[14.5px] leading-[1.6] text-fa-muted">
          Your organizers are the platform&rsquo;s clients. Enter any one of them to work exactly as
          they do &mdash; switch back from the top bar at any time.
        </p>
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
          counts={{ all: all.length, onboard: onboarded, pending }}
          q={q}
        />
        <span className="text-[12.5px] text-fa-muted-2">
          Showing {organizations.length} of {all.length} organizers
          {q && ` matching “${q}”`}
        </span>
      </div>

      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
