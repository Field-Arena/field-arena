'use client';

import Link from 'next/link';
import { env } from '@/shared/lib/env';

import { toast } from 'sonner';
import { Card, Eyebrow } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton, ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { formatTimestamp } from '@/shared/lib/format/date';
import {
  useOpenTicketSales,
  useCloseTicketSales,
  useApproveSchedule,
} from '@/modules/shows/hooks/use-run-show-mutations';
import type { RunShowData } from '@/modules/shows/types';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';

export function RunShowCard({ data }: { data: RunShowData }) {
  const openSales = useOpenTicketSales();
  const closeSales = useCloseTicketSales();
  const approve = useApproveSchedule();
  const publicId = data.showSlug ?? data.showId;

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Run Show — day-of control</h2>
        <p className={SM_NOTE}>Where this show stands right now, and the day-of actions for it.</p>

        <Eyebrow className="mb-2.5 block">Results</Eyebrow>
        <p className="mb-5 text-[13.5px] text-[#101828]">
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

          <Link
            href={`/dashboard/announcing?show=${publicId}`}
            prefetch={false}
            className={ghostButtonClass}
          >
            Announcer view
          </Link>

          {data.published && (
            <GhostButton
              onClick={() => {
                void copyVendorApplyLink(publicId);
              }}
            >
              Copy vendor application link
            </GhostButton>
          )}
        </div>

        {data.published && (
          <div
            className={`fa-ticket-bar !mt-5 !mb-0 ${data.runner.ticketClosed ? 'fa-closed' : ''}`}
          >
            <div className="fa-tb-status">
              <span className="fa-tb-dot" />
              <div>
                <b>{data.runner.ticketClosed ? 'Ticket sales closed' : 'Ticket sales open'}</b>
                <span>
                  Published{data.publishedAt ? ` ${formatTimestamp(data.publishedAt)}` : ''} —
                  riders can see this show
                </span>
              </div>
            </div>
            <div className="fa-tb-link">
              <span className="fa-tb-url">{ticketLinkUrl(publicId)}</span>
              <button
                type="button"
                className="fa-btn fa-btn-ghost fa-btn-sm"
                onClick={() => {
                  void copyTicketLink(publicId);
                }}
              >
                Copy link
              </button>
              <Link
                href={`/rider/shows/${publicId}`}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="fa-btn fa-btn-ghost fa-btn-sm"
              >
                Preview ticket page ↗
              </Link>
            </div>
          </div>
        )}
      </Card>

      <SectionFooter currentTab="Run Show" showId={publicId} />
    </>
  );
}

function ticketLinkUrl(showId: string): string {
  return `${env.siteUrl}/rider/shows/${showId}`;
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
  const url = `${env.siteUrl}/vendor-apply/${showId}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Vendor application link copied.');
  } catch {
    toast.error(`Could not copy automatically — here it is: ${url}`);
  }
}
