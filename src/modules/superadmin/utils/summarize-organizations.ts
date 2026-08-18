import type { OrganizationSummary } from '@/modules/superadmin/types';

export interface OrganizationsSummaryStats {
  onboarded: number;
  pending: number;
  totalShows: number;
  totalRiders: number;
  withShows: number;
}

/**
 * The "Clients — Organizers" overview page's stat-bar figures, derived from the
 * full (unfiltered) organization list so they always describe the platform, not
 * whatever the search/status filter currently narrows the table to.
 */
export function summarizeOrganizations(orgs: OrganizationSummary[]): OrganizationsSummaryStats {
  const onboarded = orgs.filter((org) => org.onboarded).length;
  return {
    onboarded,
    pending: orgs.length - onboarded,
    totalShows: orgs.reduce((sum, org) => sum + org.showCount, 0),
    totalRiders: orgs.reduce((sum, org) => sum + org.riderCount, 0),
    withShows: orgs.filter((org) => org.showCount > 0).length,
  };
}
