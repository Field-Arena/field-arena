import type { OrganizationSummary } from '@/modules/superadmin/types';

export interface OrganizationsSummaryStats {
  onboarded: number;
  pending: number;
  totalShows: number;
  totalRiders: number;
  withShows: number;
}

export function summarizeOrganizations(orgs: OrganizationSummary[]): OrganizationsSummaryStats {
  const onboarded = orgs.filter((org) => org.onboarded).length;
  return {
    onboarded,
    pending: orgs.length - onboarded,
    totalShows: orgs.reduce((sum, org) => sum + org.showCount, 0),
    // Legacy summed each show's entry count here, and its revenue estimate
    // multiplied that same figure — the two must agree.
    totalRiders: orgs.reduce((sum, org) => sum + org.entryCount, 0),
    withShows: orgs.filter((org) => org.showCount > 0).length,
  };
}

/* Legacy loadOrgsFromApi() filtered soft-deleted and demo orgs out of the
 * console's list entirely: real customers and the default view shouldn't see
 * them, while their rows and every child record stay intact in the database.
 * They remain reachable through the explicit Deleted / Demo filters, which is
 * what keeps "Restore organizer" usable. */
export function isActiveOrganization(org: OrganizationSummary): boolean {
  return org.deletedAt === null && !org.isDemo;
}
