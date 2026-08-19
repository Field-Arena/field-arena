import type { LeadRow } from '@/modules/superadmin/types';

export interface LeadFunnelSummary {
  counts: Record<string, number>;

  closingRate: number | null;
}

export function summarizeLeadFunnel(leads: LeadRow[]): LeadFunnelSummary {
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const key = lead.status ?? 'new';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const resolved =
    (counts.demo_completed ?? 0) +
    (counts.onboarding ?? 0) +
    (counts.customer ?? 0) +
    (counts.lost ?? 0);
  const closingRate = resolved ? Math.round(((counts.customer ?? 0) / resolved) * 100) : null;

  return { counts, closingRate };
}
