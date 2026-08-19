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

const BREAKDOWN_STAGES: { key: string; label: string; lost?: boolean }[] = [
  { key: 'demo_scheduled', label: 'Demo scheduled' },
  { key: 'demo_completed', label: 'Demo completed' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'customer', label: 'Customer (closed won)' },
  { key: 'lost', label: 'Lost', lost: true },
];

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
        (l.email ?? '').toLowerCase().includes(term),
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
          className="text-hunter-deep hover:border-gold inline-flex h-auto items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold transition-colors hover:bg-transparent"
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
                status: LEAD_STATUSES.find((s) => s.value === l.status)?.label ?? l.status ?? 'New',
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
          className="text-hunter-deep hover:border-gold inline-flex h-auto items-center gap-2 rounded-[9px] border border-[#D7E0DA] bg-white px-[15px] py-2.5 text-[13px] font-semibold transition-colors hover:bg-transparent"
        >
          <DownloadIcon className="size-[15px]" aria-hidden />
          Export Contact List
        </Button>
        <div className="relative ml-auto max-w-[300px] min-w-[190px] flex-[1_1_220px]">
          <SearchIcon
            className="absolute top-1/2 left-[13px] size-[15px] -translate-y-1/2 text-[#9AA6A0]"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search targets…"
            className="text-hunter-deep focus-visible:border-gold focus-visible:ring-gold/[.14] h-auto w-full rounded-[9px] border border-[#D7E0DA] bg-white py-2.5 pr-3.5 pl-9 text-[13.5px] focus-visible:ring-[3px] focus-visible:outline-none"
          />
        </div>
      </div>

      {breakdownOpen && (
        <div className="[animation:fa-in_.16s_ease-out_both] rounded-[14px] border border-[#E7E0D0] bg-[#F6F3EC] px-[26px] py-6">
          <h3 className={`${NR} text-hunter-deep mb-4 text-[21px] font-medium tracking-[-.012em]`}>
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
                  <span className="text-hunter-deep text-right text-[12.5px] font-bold">
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
          <span className={`${NR} text-hunter-deep text-[20px]`}>Newest targets</span>
          <span className="inline-flex h-5 items-center rounded-full bg-[#F9F0D8] px-[9px] text-[10.5px] font-bold text-[#8A6D14]">
            {total}
          </span>

          <span className="text-hunter-deep ml-auto text-[12.5px] font-bold">
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
                className={`text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] uppercase ${
                  i === 2 || i === 4 ? 'text-right' : ''
                }`}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} text-hunter-deep mb-2 text-[23px]`}>
                {search.trim() ? `No targets match “${search.trim()}”.` : 'No leads yet'}
              </div>
              <p className="text-fa-muted-2 text-[13.5px]">
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
                  <span className="text-hunter-deep text-[13.5px] leading-[1.35] font-bold">
                    {lead.org}
                  </span>
                  {lead.contact && (
                    <span className="text-fa-muted-2 text-[12px]">{lead.contact}</span>
                  )}
                </div>
                <span className="text-fa-muted truncate text-[12.5px]">{lead.email ?? '—'}</span>
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
                    className="text-hunter-deep hover:border-gold inline-flex items-center gap-1.5 rounded-lg border border-[#C4D3CB] px-3 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
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
