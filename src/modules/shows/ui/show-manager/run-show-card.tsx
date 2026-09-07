'use client';

import Link from 'next/link';

import { toast } from 'sonner';
import { Card, Eyebrow } from '@/shared/ui/organizer/card';
import { PrimaryButton, GhostButton, ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { fa } from '@/shared/lib/organizer-theme';
import { formatTimestamp } from '@/shared/lib/format/date';
import { Input } from '@/shared/ui/shadcn/input';
import {
  useOpenTicketSales,
  useCloseTicketSales,
  useApproveSchedule,
} from '@/modules/shows/hooks/use-run-show-mutations';
import type { RunShowData } from '@/modules/shows/data/queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';

export function RunShowCard({ data }: { data: RunShowData }) {
  const openSales = useOpenTicketSales();
  const closeSales = useCloseTicketSales();
  const approve = useApproveSchedule();

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Run Show</h2>
        <p className={SM_NOTE}>Where this show stands right now, and the day-of actions for it.</p>
        <p className="mb-5 text-[12px] text-[#98A29D]">
          Stage and vitals are shown at the top of this page.
        </p>

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
