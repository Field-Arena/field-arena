import type { Metadata } from 'next';
import Link from 'next/link';
import { House, CalendarDays, Users, DollarSign, Clock } from 'lucide-react';
import { listOrganizations } from '@/modules/superadmin/data/queries';
import { OrganizationsTable } from '@/modules/superadmin/ui/organizations-table';
import { ConsoleStatBar } from '@/modules/superadmin/ui/console-stat-bar';
import { AddOrganizerDialog } from '@/modules/superadmin/ui/add-organizer-dialog';
import {
  summarizeOrganizations,
  isActiveOrganization,
  mostRecentOrganizations,
} from '@/modules/superadmin/utils/summarize-organizations';
import { formatMoney } from '@/shared/lib/format/currency';

export const metadata: Metadata = {
  title: 'Overview — SuperAdmin Console',
};

const RECENT_COUNT = 5;

/* The redesign's console landing: the platform at a glance, with the most
 * recent organizers. The full, filterable list is on Organizers. */
export default async function SuperAdminOverviewPage() {
  const everything = await listOrganizations();
  // Deleted and demo organizations stay out of the overview, as they do out of
  // the default organizer list.
  const all = everything.filter(isActiveOrganization);
  const { onboarded, pending, totalShows, totalRiders, withShows } = summarizeOrganizations(all);
  const revenue = all.reduce((sum, org) => sum + org.revenueEstimate, 0);
  const recent = mostRecentOrganizations(all, RECENT_COUNT);

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Overview</h2>
          <p>
            Everything happening across the platform at a glance — your organizers, their shows, and
            where each one is in onboarding.
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
            label: 'Shows',
            value: totalShows,
            note: `across ${String(withShows)} ${withShows === 1 ? 'organizer' : 'organizers'}`,
            icon: CalendarDays,
            iconTone: 'blue',
          },
          {
            label: 'Riders (est.)',
            value: totalRiders,
            note: totalRiders === 0 ? 'no entries open yet' : 'across every open show',
            icon: Users,
            iconTone: 'purple',
          },
          {
            label: 'Revenue (est.)',
            value: formatMoney(revenue),
            note: 'from entered fees — nothing collected yet',
            icon: DollarSign,
            iconTone: 'green',
          },
          {
            label: 'Pending invites',
            value: pending,
            note: pending === 0 ? 'every invite accepted' : 'awaiting first sign-in',
            tone: pending === 0 ? undefined : 'warn',
            icon: Clock,
            iconTone: 'amber',
          },
        ]}
      />

      <div className="fa-card mt-6">
        <div className="fa-card-head">
          <div>
            <h3>Recent organizers</h3>
            <div className="fa-sub">
              {all.length} clients · {onboarded} onboarded · {pending} pending
            </div>
          </div>
          <Link
            href="/dashboard/superadmin/organizers"
            prefetch={false}
            className="fa-act fa-enter no-underline"
          >
            View all →
          </Link>
        </div>
        <OrganizationsTable organizations={recent} />
      </div>
    </section>
  );
}
