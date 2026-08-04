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
import { SHOW_STAGES } from '@/shared/constants/show-stages';
import {
  useOpenTicketSales,
  useCloseTicketSales,
  useApproveSchedule,
} from '../../hooks/use-run-show-mutations';
import type { RunShowData } from '../../data/queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from './tokens';

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
    { icon: <Users className="size-[18px]" aria-hidden />, label: 'Total riders', value: String(data.stats.riders) },
    { icon: <ClipboardList className="size-[18px]" aria-hidden />, label: 'Entries sold', value: String(data.stats.entries) },
    { icon: <IconHorse size={18} />, label: 'Horses', value: String(data.stats.horses) },
    { icon: <Tent className="size-[18px]" aria-hidden />, label: 'Vendor spaces', value: String(data.stats.vendorSpaces) },
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
                className={`inline-flex items-center gap-2 whitespace-nowrap text-[13px] ${
                  i === currentIndex ? 'font-semibold text-forest' : 'text-[#5A6B63]'
                }`}
              >
                <span
                  className={`size-2 rounded-full border ${
                    i <= currentIndex ? 'border-[#3E8E5A] bg-[#3E8E5A]' : 'border-[#D9E1DD] bg-transparent'
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
        <p className="mb-5 text-[13.5px] text-ink-deep">
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
        </div>
      </Card>
    </>
  );
}
