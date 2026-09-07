'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ClipboardListIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { formatDateRange } from '@/shared/lib/format/date';
import { enterAsOrganizer } from '@/shared/lib/impersonation';
import { DeleteShowButton } from '@/modules/shows/ui/show-manager/delete-show-button';
import { ExperienceShowMenu } from '@/modules/superadmin/ui/experience-show-menu';
import type { OrganizationShowsDetail, ShowStage } from '@/modules/superadmin/types';

const NR = 'font-[family-name:var(--font-nr)]';
const COLS = 'minmax(220px,1fr) 180px 118px 88px 300px';

/* Legacy SHOW_STAGE_LABEL — the organizer-facing wording for each stage, so
 * the console and the workspace describe a show the same way. */
const STAGE_LABEL: Record<ShowStage, string> = {
  setup: 'Setup',
  'on-sale': 'On Sale',
  live: 'Live',
};

const STAGE_TONE: Record<ShowStage, string> = {
  setup: 'bg-[#F1F3F2] text-[#5A6B63]',
  'on-sale': 'bg-[#F9F0D8] text-[#8A6D14]',
  live: 'bg-[#E6F1EA] text-[#2E7048]',
};

export function OrganizationShowsBoard({ org }: { org: OrganizationShowsDetail }) {
  const [entering, startEntering] = useTransition();

  const totalEntries = org.shows.reduce((sum, show) => sum + show.entryCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/superadmin"
          className="text-fa-muted hover:text-gold mb-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          All organizers
        </Link>

        <h1
          className={`${NR} text-hunter-deep mb-2 text-[32px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          {org.name} — Shows
        </h1>
        <p className="text-fa-muted max-w-[680px] text-[14.5px] leading-[1.6]">
          Every show this organizer runs. Open one to see who is entered, or enter their workspace
          for the full organizer view.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={entering}
          className="border-line-strong text-forest hover:border-gold inline-flex h-auto items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
          onClick={() => {
            startEntering(async () => {
              await enterAsOrganizer(org.id);
            });
          }}
        >
          {entering ? 'Entering…' : 'Enter as organizer'}
          <ArrowRightIcon className="size-[13px]" aria-hidden />
        </Button>
        <Link
          href={`/dashboard/superadmin/users?org=${org.id}`}
          className="border-line-strong text-forest hover:border-gold inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
        >
          <UsersIcon className="size-[13px]" aria-hidden />
          View {org.name}&rsquo;s staff
        </Link>
        {!org.onboarded && (
          <Link
            href={`/dashboard/superadmin/organizations/${org.id}/onboarding`}
            className="border-line-strong text-forest hover:border-gold inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
          >
            <ClipboardListIcon className="size-[13px]" aria-hidden />
            Onboarding profile
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Shows', value: org.shows.length },
          { label: 'Riders entered', value: totalEntries },
        ].map((tile) => (
          <div
            key={tile.label}
            className="flex min-w-[138px] flex-[0_1_180px] flex-col gap-1.5 rounded-[11px] border border-[#E7E0D0] bg-[#F6F3EC] px-[18px] pt-4 pb-[15px]"
          >
            <span
              className={`${NR} text-[30px] leading-none`}
              style={{ color: tile.value === 0 ? '#C4CDC8' : '#0D2C23' }}
            >
              {tile.value}
            </span>
            <span className="text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] uppercase">
              {tile.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] gap-3.5 border-b border-[#E2E8E4] bg-[#F6F3EC] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['Show', 'Dates', 'Stage', 'Riders', 'Action'].map((h, i) => (
              <span
                key={h}
                className={cn(
                  'text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] uppercase',
                  i >= 3 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {org.shows.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} text-hunter-deep mb-2 text-[23px]`}>No shows yet</div>
              <p className="text-fa-muted-2 text-[13.5px]">
                This organizer hasn&apos;t built a show on the platform yet.
              </p>
            </div>
          ) : (
            org.shows.map((show) => (
              <div
                key={show.id}
                className="grid min-w-[760px] items-center gap-3.5 border-b border-[#EEF2EF] px-5 py-[15px] last:border-b-0 hover:bg-[#FAFCFB]"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="text-hunter-deep min-w-0 truncate text-sm font-bold">
                  {show.name}
                </span>
                <span className="text-fa-muted text-[12.5px]">
                  {formatDateRange(show.startDate, show.endDate)}
                </span>
                <span
                  className={cn(
                    'inline-flex h-[22px] w-fit items-center rounded-full px-2.5 text-[11px] font-bold',
                    STAGE_TONE[show.stage],
                  )}
                >
                  {STAGE_LABEL[show.stage]}
                </span>
                <span
                  className={`${NR} text-right text-xl`}
                  style={{ color: show.entryCount === 0 ? '#C4CDC8' : '#0D2C23' }}
                >
                  {show.entryCount}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/superadmin/organizations/${org.id}/shows/${show.id}`}
                    className="text-hunter-deep hover:border-gold inline-flex items-center gap-1.5 rounded-lg border border-[#C4D3CB] px-3 py-2 text-[12.5px] font-bold whitespace-nowrap transition-colors hover:bg-[#FFFCF2]"
                  >
                    Riders
                    <ArrowRightIcon className="size-[13px]" aria-hidden />
                  </Link>
                  <ExperienceShowMenu showId={show.id} showName={show.name} />
                  {/* SuperAdmin can delete a show at any stage — the platform's
                      escalation path when an organizer is blocked. A show that
                      is already on sale or live demands the name typed back. */}
                  <DeleteShowButton
                    showId={show.id}
                    showName={show.name}
                    orgName={org.name}
                    requireNameConfirmation={show.stage !== 'setup'}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
