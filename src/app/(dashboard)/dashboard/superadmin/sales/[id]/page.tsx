import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLead } from '@/modules/superadmin/data/queries';
import { LeadDetail } from '@/modules/superadmin/ui/lead-detail';

export const metadata: Metadata = {
  title: 'Target — Sales Funnel',
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return <LeadDetail lead={lead} />;
}
