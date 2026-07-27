import type { Metadata } from 'next';
import { listLeads } from '@/modules/superadmin/data/queries';
import { LEAD_STATUSES, LEAD_STATUS_TONE } from '@/modules/superadmin/constants';
import { StatusBadge } from '@/shared/ui/status-badge';
import { StatTile } from '@/shared/ui/stat-tile';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';

export const metadata: Metadata = {
  title: 'Sales Funnel — SuperAdmin Console',
};

// Typed as Map<string, string> deliberately. LEAD_STATUSES is `as const`, so
// inference would narrow the key to the literal union and reject a lookup with
// the plain `string` that comes back from the database column.
const STATUS_LABELS = new Map<string, string>(LEAD_STATUSES.map((s) => [s.value, s.label]));

export default async function SalesFunnelPage() {
  const leads = await listLeads();

  // Counted per stage in one pass rather than one query per stage.
  const byStatus = new Map<string, number>();
  for (const lead of leads) {
    const key = lead.status ?? 'new';
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }

  const pipelineValue = leads
    .filter((l) => l.status !== 'lost' && l.status !== 'customer')
    .reduce((sum, l) => sum + (l.avg_revenue_per_show ?? 0), 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mb-1 font-serif text-[32px] font-bold leading-tight text-hunter-deep">
          Sales Funnel
        </h1>
        <p className="text-fa-muted text-[15px]">Master lead list, demos, and onboarding.</p>
      </div>

      <section aria-label="Pipeline summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Leads" value={leads.length} sub="all stages" />
          <StatTile label="Demo scheduled" value={byStatus.get('demo_scheduled') ?? 0} />
          <StatTile label="Onboarding" value={byStatus.get('onboarding') ?? 0} />
          <StatTile label="Customers" value={byStatus.get('customer') ?? 0} />
          <StatTile
            label="Open pipeline"
            value={formatMoney(pipelineValue)}
            sub="est. revenue per show"
            tone="money"
          />
        </div>
      </section>

      <section aria-label="Leads" className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-hunter-deep">Master target list</h2>

        {leads.length === 0 ? (
          <p className="text-fa-muted rounded-xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm">
            No leads yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full border-collapse text-[13.5px]">
              <caption className="sr-only">Sales leads and their pipeline stage</caption>
              <thead>
                <tr className="bg-hunter-pale">
                  {['Organization', 'Contact', 'Shows / yr', 'Stage', 'Est. revenue', 'Demo'].map(
                    (heading, index) => (
                      <th
                        key={heading}
                        scope="col"
                        className={`text-fa-muted px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] ${
                          index === 2 || index === 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-semibold text-hunter-deep">{lead.org_name}</td>
                    <td className="text-fa-muted px-3 py-2.5">
                      {lead.contact_name ?? '—'}
                      {lead.email && (
                        <span className="block text-xs">{lead.email}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-hunter-deep">
                      {lead.shows_per_year ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={LEAD_STATUS_TONE[lead.status ?? 'new'] ?? 'neutral'}>
                        {STATUS_LABELS.get(lead.status ?? 'new') ?? lead.status}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-hunter-deep">
                      {lead.avg_revenue_per_show ? formatMoney(lead.avg_revenue_per_show) : '—'}
                    </td>
                    <td className="text-fa-muted px-3 py-2.5">
                      {lead.demo_at ? formatTimestamp(lead.demo_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
