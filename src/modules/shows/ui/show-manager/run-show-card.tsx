'use client';

import Link from 'next/link';

import { toast } from 'sonner';
import { Users, ClipboardList, Tent, DollarSign } from 'lucide-react';
import { Card, Eyebrow } from '@/shared/ui/organizer/card';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { PrimaryButton, GhostButton, ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { IconHorse } from '@/shared/ui/organizer/icons';
import { fa } from '@/shared/lib/organizer-theme';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import { Input } from '@/shared/ui/shadcn/input';
import {
  useOpenTicketSales,
  useCloseTicketSales,
  useApproveSchedule,
} from '@/modules/shows/hooks/use-run-show-mutations';
import type { RunShowData } from '@/modules/shows/data/queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';

const STAT_TINTS = [
  { bg: '#E3EDFB', fg: '#2E5FA8' },
  { bg: '#EEE7FA', fg: '#6B4FA0' },
  { bg: fa.goldTint, fg: fa.goldFg },
  { bg: fa.greenTint, fg: fa.green },
  { bg: fa.goldTint, fg: fa.gold },
] as const;

/**
 * "Run Show" — live-day status, ported from what showstaff.html's runner
 * stage actually has real data for. Live scoring and an announcer view have
 * no implementation yet (judging/scoring/announcements are data-layer only
 * so far), so those stay toast stubs rather than dead links, same pattern as
 * Venue's "Assign Judges" (Stable Chart, the other stub that card used to
 * carry, is real now — see modules/shows/ui/stable-chart/).
 */
export function RunShowCard({ data, canViewMoney }: { data: RunShowData; canViewMoney: boolean }) {
  const currentIndex = SHOW_STAGES.findIndex((s) => s.key === data.stage);
  const openSales = useOpenTicketSales();
  const closeSales = useCloseTicketSales();
  const approve = useApproveSchedule();

  const statCards = [
    {
      icon: <Users className="size-[18px]" aria-hidden />,
      label: 'Total riders',
      value: String(data.stats.riders),
    },
    {
      icon: <ClipboardList className="size-[18px]" aria-hidden />,
      label: 'Entries sold',
      value: String(data.stats.entries),
    },
    { icon: <IconHorse size={18} />, label: 'Horses', value: String(data.stats.horses) },
    {
      icon: <Tent className="size-[18px]" aria-hidden />,
      label: 'Vendor spaces',
      value: String(data.stats.vendorSpaces),
    },
    ...(canViewMoney
      ? [
          {
            icon: <DollarSign className="size-[18px]" aria-hidden />,
            label: 'Revenue (settled)',
            value: formatMoney(data.stats.settledRevenue),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Run Show</h2>
        <p className={SM_NOTE}>Where this show stands right now, and the day-of actions for it.</p>

        <Eyebrow className="mb-2.5 block">Stage</Eyebrow>
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          {SHOW_STAGES.map((s, i) => (
            <span key={s.key} className="contents">
              <span
                className={`inline-flex items-center gap-2 text-[13px] whitespace-nowrap ${
                  i === currentIndex ? 'text-forest font-semibold' : 'text-[#5A6B63]'
                }`}
              >
                <span
                  className={`size-2 rounded-full border ${
                    i <= currentIndex
                      ? 'border-[#3E8E5A] bg-[#3E8E5A]'
                      : 'border-[#D9E1DD] bg-transparent'
                  }`}
                />
                {s.label}
              </span>
              {i < SHOW_STAGES.length - 1 && <span className="h-px min-w-6 flex-1 bg-[#E9EDEB]" />}
            </span>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {statCards.map((card, i) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              value={card.value}
              label={card.label}
              tintBg={(STAT_TINTS[i % STAT_TINTS.length] ?? STAT_TINTS[0]).bg}
              tintFg={(STAT_TINTS[i % STAT_TINTS.length] ?? STAT_TINTS[0]).fg}
            />
          ))}
        </div>

        <Eyebrow className="mb-2.5 block">Results</Eyebrow>
        <p className="text-ink-deep mb-5 text-[13.5px]">
          {data.classResults.total === 0
            ? 'No classes on this show yet.'
            : `${String(data.classResults.resultsPublished)} of ${String(data.classResults.total)} classes have published results, ${String(data.classResults.scoringOpen)} open for scoring.`}
        </p>

        <Eyebrow className="mb-2.5 block">Stage actions</Eyebrow>
        <div className="flex flex-wrap gap-2.5">
          {!data.published && (
            <PrimaryButton
              disabled={openSales.isPending || !data.waiverApproved}
              title={
                data.waiverApproved
                  ? undefined
                  : 'The waiver of liability must be approved in Setup before ticket sales can open.'
              }
              onClick={() => {
                openSales.mutate(data.showId);
              }}
            >
              Open ticket sales
            </PrimaryButton>
          )}
          {data.published && !data.runner.ticketClosed && (
            <PrimaryButton
              disabled={closeSales.isPending}
              onClick={() => {
                closeSales.mutate(data.showId);
              }}
            >
              Close ticket sales
            </PrimaryButton>
          )}
          {data.runner.ticketClosed && !data.runner.approved && (
            <PrimaryButton
              disabled={approve.isPending}
              onClick={() => {
                approve.mutate(data.showId);
              }}
            >
              Approve schedule &amp; go live
            </PrimaryButton>
          )}
          {/* The announcer dashboard is real — ring status, running order and
              published results. This used to be a fake door saying otherwise. */}
          <Link href={`/dashboard/announcing?show=${data.showId}`} className={ghostButtonClass}>
            Announcer view
          </Link>
          <GhostButton
            onClick={() => {
              toast('Live scoring isn’t built yet — coming in a later update.');
            }}
          >
            Start live scoring
          </GhostButton>
          {/* Ported from showstaff.html's smCopyTicketLink — the link a
              vendor needs to apply with no account of their own (see
              app/vendor-apply/[showId]/page.tsx). Only offered once the show
              is published: that page 404s on an unpublished show, same gate
              getPublicVendorApplyShow applies. */}
          {data.published && (
            <GhostButton
              onClick={() => {
                void copyVendorApplyLink(data.showId);
              }}
            >
              Copy vendor application link
            </GhostButton>
          )}
        </div>

        {/* Ported from legacy's publishStateCardHtml (showstaff.html) — the
            one place an organizer could actually get the real rider ticket
            link, which had no equivalent anywhere in this app until now
            (only the Stage Actions publish/unpublish buttons existed, with
            no way to see or copy the link itself afterward). */}
        {data.published && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{ background: fa.greenTint, border: `1px solid ${fa.greenLine}` }}
          >
            <p className="text-[13.5px]" style={{ color: fa.green }}>
              <strong>✓ Published</strong> — riders can see this show and buy tickets
              {data.publishedAt ? ` since ${formatTimestamp(data.publishedAt)}` : ''}.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Input
                type="text"
                readOnly
                value={ticketLinkUrl(data.showId)}
                onClick={(event) => {
                  event.currentTarget.select();
                }}
                className="text-ink-deep h-auto min-w-[220px] flex-1 rounded-md border border-[#D9E1DD] bg-white px-2.5 py-[7px] text-[12.5px]"
              />
              <GhostButton
                onClick={() => {
                  void copyTicketLink(data.showId);
                }}
              >
                Copy link
              </GhostButton>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/rider/shows/${data.showId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ghostButtonClass}
              >
                Preview ticket page ↗
              </Link>
            </div>
          </div>
        )}
      </Card>

      <SectionFooter currentTab="Run Show" showId={data.showId} />
    </>
  );
}

function ticketLinkUrl(showId: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/rider/shows/${showId}`;
}

async function copyTicketLink(showId: string): Promise<void> {
  const url = ticketLinkUrl(showId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Ticket link copied.');
  } catch {
    toast.error(`Could not copy automatically — here it is: ${url}`);
  }
}

async function copyVendorApplyLink(showId: string): Promise<void> {
  const url = `${window.location.origin}/vendor-apply/${showId}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Vendor application link copied.');
  } catch {
    toast.error(`Could not copy automatically — here it is: ${url}`);
  }
}
