'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, BarChart3Icon, DownloadIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { AddTargetDialog } from '@/modules/superadmin/ui/add-target-dialog';
import { LeadStatusPill } from '@/modules/superadmin/ui/lead-status-pill';
import { LEAD_STATUSES } from '@/modules/superadmin/constants';
import { buildLeadsCsv } from '@/modules/superadmin/utils/build-leads-csv';
import { leadsCsvFilename } from '@/modules/superadmin/utils/leads-csv-filename';

const NR = 'font-[family-name:var(--font-nr)]';
const COLS = 'minmax(230px,1fr) minmax(190px,240px) 78px 128px 104px';

export interface LeadListItem {
  id: string;
  org: string;
  contact: string | null;
  email: string | null;
  shows: number | null;
  status: string | null;
}

/** Bars in the closing-rate breakdown, in the design's order. `lost` renders red. */
const BREAKDOWN_STAGES: { key: string; label: string; lost?: boolean }[] = [
  { key: 'demo_scheduled', label: 'Demo scheduled' },
  { key: 'demo_completed', label: 'Demo completed' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'customer', label: 'Customer (closed won)' },
  { key: 'lost', label: 'Lost', lost: true },
];

/**
 * The interactive half of the Sales Funnel: search, the collapsible closing-rate
 * breakdown, and the "Newest targets" table. Data arrives as props; only the
 * search text and the breakdown open/closed state live here.
 */
export function FunnelBoard({
  leads,
  counts,
  total,
}: {
  leads: LeadListItem[];
  counts: Record<string, number>;
  total: number;
}) {
  const [search, setSearch] = useState('');
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(
      (l) =>
        l.org.toLowerCase().includes(term) ||
        (l.contact ?? '').toLowerCase().includes(term) ||
        (l.email ?? '').toLowerCase().includes(term)
    );
  }, [leads, search]);

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <AddTargetDialog />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setBreakdownOpen((v) => !v);
          }}
          className="h-auto inline-flex items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-hunter-deep hover:bg-transparent transition-colors hover:border-gold"
        >
          <BarChart3Icon className="size-[15px]" aria-hidden />
          {breakdownOpen ? 'Hide closing rate breakdown' : 'View closing rate breakdown'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const csv = buildLeadsCsv(
              filtered.map((l) => ({
                org: l.org,
                contact: l.contact,
                email: l.email,
                shows: l.shows,
                status: LEAD_STATUSES.find((s) => s.value === l.status)?.label ?? (l.status ?? 'New'),
              })),
            );
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = leadsCsvFilename();
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="h-auto inline-flex items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-hunter-deep hover:bg-transparent transition-colors hover:border-gold"
        >
          <DownloadIcon className="size-[15px]" aria-hidden />
          Export Contact List
        </Button>
        <div className="relative ml-auto min-w-[190px] max-w-[300px] flex-[1_1_220px]">
          <SearchIcon
            className="absolute left-[13px] top-1/2 size-[15px] -translate-y-1/2 text-[#9AA6A0]"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search targets…"
            className="h-auto w-full rounded-[9px] border border-[#D7E0DA] bg-white py-2.5 pl-9 pr-3.5 text-[13.5px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.14]"
          />
        </div>
      </div>

      {breakdownOpen && (
        <div className="[animation:fa-in_.16s_ease-out_both] rounded-[14px] border border-[#E7E0D0] bg-[#F6F3EC] px-[26px] py-6">
          <h3 className={`${NR} mb-4 text-[21px] font-medium tracking-[-.012em] text-hunter-deep`}>
            Closing rate breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {BREAKDOWN_STAGES.map((stage) => {
              const count = counts[stage.key] ?? 0;
              return (
                <div
                  key={stage.key}
                  className="grid items-center gap-[18px]"
                  style={{ gridTemplateColumns: 'minmax(120px,170px) minmax(0,1fr) 78px' }}
                >
                  <span
                    className="text-[13.5px]"
                    style={{ color: stage.lost ? '#B4432F' : '#16261F' }}
                  >
                    {stage.label}
                  </span>
                  <span className="relative block h-2.5 overflow-hidden rounded-[5px] bg-[#E4EAE6]">
                    <span
                      className="absolute inset-y-0 left-0 rounded-[5px]"
                      style={{
                        width: `${String(pct(count))}%`,
                        background: stage.lost ? '#B4432F' : '#0D2C23',
                      }}
                    />
                  </span>
                  <span className="text-right text-[12.5px] font-bold text-hunter-deep">
                    {count} ({pct(count)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
        <div className="flex flex-wrap items-center gap-3.5 border-b border-[#E2E8E4] px-5 py-4">
          <span className={`${NR} text-[20px] text-hunter-deep`}>Newest targets</span>
          <span className="inline-flex h-5 items-center rounded-full bg-[#F9F0D8] px-[9px] text-[10.5px] font-bold text-[#8A6D14]">
            {total}
          </span>
          {/* Not a link to a separate page: the table below already lists
              every lead (listLeads has no limit), so "viewing all" is just
              this table. Plain text states that rather than pointing a link
              at a fuller view that doesn't exist. */}
          <span className="ml-auto text-[12.5px] font-bold text-hunter-deep">
            Showing all {total} {total === 1 ? 'target' : 'targets'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] gap-3.5 border-b border-[#E2E8E4] bg-[#F6F3EC] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['Organization', 'Email', 'Shows/yr', 'Status', 'Action'].map((h, i) => (
              <span
                key={h}
                className={`text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2 ${
                  i === 2 || i === 4 ? 'text-right' : ''
                }`}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} mb-2 text-[23px] text-hunter-deep`}>
                {search.trim() ? `No targets match “${search.trim()}”.` : 'No leads yet'}
              </div>
              <p className="text-[13.5px] text-fa-muted-2">
                {search.trim()
                  ? 'Try a different name, org, or email.'
                  : 'Add one, or share your Calendly demo link.'}
              </p>
            </div>
          ) : (
            filtered.map((lead) => (
              <div
                key={lead.id}
                className="grid min-w-[760px] items-center gap-3.5 border-b border-[#EEF2EF] px-5 py-3.5 last:border-b-0 hover:bg-[#FAFCFB]"
                style={{ gridTemplateColumns: COLS }}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13.5px] font-bold leading-[1.35] text-hunter-deep">
                    {lead.org}
                  </span>
                  {lead.contact && (
                    <span className="text-[12px] text-fa-muted-2">{lead.contact}</span>
                  )}
                </div>
                <span className="truncate text-[12.5px] text-fa-muted">{lead.email ?? '—'}</span>
                <span
                  className={`${NR} text-right text-[19px]`}
                  style={{ color: lead.shows == null ? '#C4CDC8' : '#0D2C23' }}
                >
                  {lead.shows ?? '—'}
                </span>
                <LeadStatusPill status={lead.status} />
                <div className="flex justify-end">
                  <Link
                    href={`/dashboard/superadmin/sales/${lead.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4D3CB] px-3 py-2 text-[12.5px] font-bold text-hunter-deep transition-colors hover:border-gold hover:bg-[#FFFCF2]"
                  >
                    Open
                    <ArrowRightIcon className="size-[13px]" aria-hidden />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3.5 text-[12.5px] text-[#9AA6A0]">
          Newest first. A dash means the target hasn&apos;t told us yet — it fills in after the demo
          call.
        </div>
      </div>
    </div>
  );
}
