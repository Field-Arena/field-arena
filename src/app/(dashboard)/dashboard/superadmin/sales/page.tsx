import type { Metadata } from 'next';
import { listLeads } from '@/modules/superadmin/data/queries';
import { FunnelBoard, type LeadListItem } from '@/modules/superadmin/ui/funnel-board';
import { summarizeLeadFunnel } from '@/modules/superadmin/utils';

export const metadata: Metadata = {
  title: 'Sales Funnel — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

/**
 * The Sales Funnel, matching the Admin Console design: a "Pipeline" header, six
 * stat tiles, then the interactive board (search, closing-rate breakdown, and the
 * newest-targets table). Data is read here and the counts computed once; the
 * board is the only client piece.
 */
export default async function SalesFunnelPage() {
  const leads = await listLeads();

  // Closing rate: of the leads that reached a real outcome (demo done, onboarding,
  // won, or lost), how many became customers. New and demo-scheduled are excluded —
  // they have not had a real chance yet. Matches the legacy formula exactly.
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
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">
          Pipeline
        </div>
        <h1 className={`${NR} mb-2.5 text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep`}>
          Sales Funnel
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
          The master target list — organizations we&apos;re selling Field &amp; Arena to. Leads land
          here automatically when someone books a demo through Calendly, or add one yourself below.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tiles.map((tile) => {
          const zero = tile.value === '0' || tile.value === '—';
          return (
            <div
              key={tile.label}
              className="flex min-w-[138px] flex-[1_1_150px] flex-col gap-1.5 rounded-[11px] border border-[#E7E0D0] bg-[#F6F3EC] px-[18px] pb-[15px] pt-4"
            >
              <span
                className={`${NR} text-[30px] leading-none`}
                style={{ color: zero ? '#C4CDC8' : '#0D2C23' }}
              >
                {tile.value}
              </span>
              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2">
                {tile.label}
              </span>
            </div>
          );
        })}
      </div>

      <FunnelBoard leads={items} counts={counts} total={leads.length} />
    </div>
  );
}
