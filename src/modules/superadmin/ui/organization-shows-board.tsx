'use client';

import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, ClipboardListIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { formatDateRange } from '@/shared/lib/format/date';
import { useEnterAsOrganizer } from '../hooks/use-session-mutations';
import { DeleteShowButton } from '@/modules/shows/public';
import { ExperienceShowMenu } from '@/modules/superadmin/ui/experience-show-menu';
import { StatTiles } from '@/modules/superadmin/ui/stat-tiles';
import { OrgAvatar } from '@/shared/ui/organizer/org-avatar';
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
  setup: 'bg-[#EEF1F4] text-[#475467]',
  'on-sale': 'bg-[#FDF2E3] text-[#B45309]',
  live: 'bg-[#E7F6EE] text-[#15794F]',
};

export function OrganizationShowsBoard({ org }: { org: OrganizationShowsDetail }) {
  const { isPending: entering, enter: enterAsOrganizer } = useEnterAsOrganizer();

  const totalEntries = org.shows.reduce((sum, show) => sum + show.entryCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/superadmin/organizers" prefetch={false} className="fa-backlink">
          <ArrowLeftIcon className="size-4" aria-hidden />
          All organizers
        </Link>

        <div className="fa-org-hero">
          <OrgAvatar name={org.name} size={64} className="rounded-[16px] text-[22px]" />
          <div className="fa-oh-meta">
            <h1 className="fa-oh-title m-0">
              {org.name}
              <span
                className={`fa-badge ${org.onboarded ? 'fa-onboard' : 'fa-pending'} !text-[11px]`}
              >
                <span className="fa-dot" />
                {org.onboarded ? 'Onboarded' : 'Pending'}
              </span>
            </h1>
            <div className="fa-oh-sub">
              {[org.city, org.region].filter(Boolean).join(', ') || 'No location set'} ·{' '}
              {org.shows.length} show{org.shows.length === 1 ? '' : 's'} — open one to see who is
              entered
            </div>
          </div>
          <div className="fa-oh-actions">
            <Link
              href={`/dashboard/superadmin/users?org=${org.id}`}
              prefetch={false}
              className="fa-btn fa-btn-ghost"
            >
              <UsersIcon className="size-4" aria-hidden />
              Staff
            </Link>
            {!org.onboarded && (
              <Link
                href={`/dashboard/superadmin/organizations/${org.id}/onboarding`}
                prefetch={false}
                className="fa-btn fa-btn-ghost"
              >
                <ClipboardListIcon className="size-4" aria-hidden />
                Onboarding profile
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              disabled={entering}
              className="fa-btn fa-btn-primary h-auto"
              onClick={() => {
                enterAsOrganizer(org.id);
              }}
            >
              <ArrowRightIcon className="size-4" aria-hidden />
              {entering ? 'Entering…' : 'Enter as organizer'}
            </Button>
          </div>
        </div>
      </div>

      <StatTiles
        tiles={[
          { label: 'Shows', value: org.shows.length },
          { label: 'Riders entered', value: totalEntries },
        ]}
      />

      <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] gap-3.5 border-b border-[#E7EAEE] bg-[#FBFCFD] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['Show', 'Dates', 'Stage', 'Riders', 'Action'].map((h, i) => (
              <span
                key={h}
                className={cn(
                  'text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase',
                  i >= 3 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {org.shows.length === 0 ? (
            <div className="px-5 py-[52px] text-center">
              <div className={`${NR} mb-2 text-[23px] text-[#101828]`}>No shows yet</div>
              <p className="text-[13.5px] text-[#8A94A3]">
                This organizer hasn&apos;t built a show on the platform yet.
              </p>
            </div>
          ) : (
            org.shows.map((show) => (
              <div
                key={show.id}
                className="grid min-w-[760px] items-center gap-3.5 border-b border-[#EEF1F4] px-5 py-[15px] last:border-b-0 hover:bg-[#FBFCFD]"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="min-w-0 truncate text-sm font-bold text-[#101828]">
                  {show.name}
                </span>
                <span className="text-[12.5px] text-[#475467]">
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
                  className="text-right text-lg font-bold tabular-nums"
                  style={{ color: show.entryCount === 0 ? '#C3CAD3' : '#101828' }}
                >
                  {show.entryCount}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/superadmin/organizations/${org.id}/shows/${show.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D0D5DD] px-3 py-2 text-[12.5px] font-bold whitespace-nowrap text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-[#FBFCFD]"
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
