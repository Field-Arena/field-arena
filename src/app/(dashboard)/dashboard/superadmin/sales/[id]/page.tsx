import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLead } from '@/modules/superadmin/data/queries';
import { LeadDetail } from '@/modules/superadmin/ui/lead-detail';

export const metadata: Metadata = {
  title: 'Target — Sales Funnel',
};

/**
 * A single sales target. Everything editable — contact, economics, notes, and
 * onboarding — lives in LeadDetail; this only resolves the lead and 404s when it
 * is missing or the caller's RLS cannot see it.
 */
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return <LeadDetail lead={lead} />;
}
