import type { Metadata } from 'next';
import { listLeads } from '@/modules/superadmin/data/queries';
import { FunnelBoard, type LeadListItem } from '@/modules/superadmin/ui/funnel-board';
import { StatTiles } from '@/modules/superadmin/ui/stat-tiles';
import { summarizeLeadFunnel } from '@/modules/superadmin/utils/summarize-lead-funnel';

export const metadata: Metadata = {
  title: 'Sales Funnel — SuperAdmin Console',
};


export default async function SalesFunnelPage() {
  const leads = await listLeads();

  const { counts, closingRate } = summarizeLeadFunnel(leads);

  const tiles: { label: string; value: string }[] = [
    { label: 'Total leads', value: String(leads.length) },
    { label: 'Demos scheduled', value: String(counts.demo_scheduled ?? 0) },
    { label: 'Demos completed', value: String(counts.demo_completed ?? 0) },
    { label: 'Onboarding', value: String(counts.onboarding ?? 0) },
    { label: 'Customers', value: String(counts.customer ?? 0) },
    { label: 'Closing rate', value: closingRate === null ? '—' : `${String(closingRate)}%` },
  ];

  const items: LeadListItem[] = leads.map((lead) => ({
    id: lead.id,
    org: lead.org_name,
    contact: lead.contact_name,
    email: lead.email,
    shows: lead.shows_per_year,
    status: lead.status,
  }));

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
          Sales Funnel
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-[#475467]">
          The master target list — organizations we&apos;re selling Field &amp; Arena to. Leads land
          here automatically when someone books a demo through Calendly, or add one yourself below.
        </p>
      </div>

      <StatTiles tiles={tiles} />

      <FunnelBoard leads={items} counts={counts} total={leads.length} />
    </div>
  );
}
