import Link from 'next/link';
import type { Metadata } from 'next';
import { getRingStatus } from '@/modules/announcements/data/queries';
import { listStaff } from '@/modules/shows/data/setup-queries';
import { getShowStats } from '@/modules/shows/data/queries';
import {
  getMyPermissions,
  listMyShows,
  listStabling,
  listVendors,
  getHorseCounts,
} from '@/modules/operations/data/queries';
import { OpsAutoRefresh } from '@/modules/operations/ui/ops-auto-refresh';
import { OpsClock } from '@/modules/operations/ui/ops-clock';
import { OPS_CLOCK_CLASS, OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { groupRingsForBoard } from '@/modules/operations/utils/group-rings';
import {
  CardTitle,
  EmptyState,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
  LiveDot,
  PageHeader,
  Pill,
  SectionLabel,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Show Operations — Field & Arena' };

const MINI_BOX = 'rounded-[12px] border-[1.5px] border-[#D9E1DD] bg-white px-3.5 py-2.5';

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Live board and on-the-ground operations" title="Live board" />;
  }

  const [rings, staff, stats, stabling, permissions, horses] = await Promise.all([
    getRingStatus(currentShow.id),
    listStaff(currentShow.id),
    getShowStats(currentShow.id),
    listStabling(currentShow.id),
    getMyPermissions(currentShow.id),
    getHorseCounts(currentShow.id),
  ]);
  const vendorCount = permissions.canViewMoney ? (await listVendors(currentShow.id)).length : null;

  // One card per ring, not per class — see groupRingsForBoard.
  const ringCards = groupRingsForBoard(rings);
  const live = ringCards.filter((r) => r.current?.scoringOpen).length;
  const publicId = currentShow.slug ?? currentShow.id;
  const navHref = (path: string) => `/dashboard/operations/${path}?show=${publicId}`;

  return (
    <div className={OPS_WRAP}>
      <OpsAutoRefresh />

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            Live · {currentShow.name}
            {currentShow.dateLabel ? ` · ${currentShow.dateLabel}` : ''} · auto-updates
          </span>
        }
        title="Live board"
        actions={
          <>
            <FaShowSelect shows={shows} currentRef={publicId} />
            <OpsClock className={OPS_CLOCK_CLASS} />
          </>
        }
      />

      <StatGrid cols={4}>
        <StatBox label="Riders" value={stats.riders} note="entered" href={navHref('riders')} />
        <StatBox
          label="Horses"
          value={horses.today}
          note={`today · ${String(horses.total)} entered`}
          href={navHref('horses')}
        />
        <StatBox
          label="Stalled"
          value={stabling.stalls.length}
          note={stabling.published ? 'in barns' : 'Stable chart not published'}
          href={navHref('stabling')}
        />
        <StatBox
          label="Vendors"
          value={vendorCount ?? '—'}
          note={vendorCount === null ? 'No money access' : 'booked'}
          href={navHref('vendors')}
        />
      </StatGrid>

      <SectionLabel>
        Ring status · {live} of {ringCards.length} live
      </SectionLabel>
      {ringCards.length === 0 ? (
        <EmptyState title="No classes" note="This show has no classes configured yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {ringCards.map((card) => {
            const cls = card.current;
            const isLive = !!cls?.scoringOpen;
            const next = cls?.upNext[0];
            return (
              <Link
                key={card.ring}
                href={navHref('schedule')}
                prefetch={false}
                className="block text-inherit no-underline"
              >
                <FaCard tone={isLive ? 'live' : 'default'} className="h-full">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{card.ring}</CardTitle>
                    {isLive ? (
                      <Pill tone="green" live>
                        Live
                      </Pill>
                    ) : (
                      <Pill tone="grey">Not started</Pill>
                    )}
                  </div>
                  <p className="mt-1 mb-2.5 text-[13.5px] font-semibold text-[#5A6B63]">
                    {cls ? cls.className : 'Nothing scheduled'}
                    {cls ? ` · ${String(cls.position)} of ${String(cls.entryCount)} ridden` : ''}
                    {card.classCount > 1 ? ` · ${String(card.classCount)} classes today` : ''}
                  </p>
                  {cls?.scoringOpen && (cls.current ?? next) && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {cls.current && (
                        <div className={MINI_BOX}>
                          <span className="block text-[12.5px] font-semibold text-[#5A6B63]">
                            Now in ring
                          </span>
                          <span className="block text-[17px] leading-tight font-bold text-[#0D2C23]">
                            #{cls.current.num} {cls.current.rider ?? '—'}
                          </span>
                          {cls.current.horse && (
                            <span className="block text-[12px] font-semibold text-[#5A6B63]">
                              on {cls.current.horse}
                            </span>
                          )}
                        </div>
                      )}
                      {next && (
                        <div className={MINI_BOX}>
                          <span className="block text-[12.5px] font-semibold text-[#5A6B63]">
                            Next up
                          </span>
                          <span className="block text-[17px] leading-tight font-bold text-[#0D2C23]">
                            #{next.num} {next.rider ?? '—'}
                          </span>
                          {next.horse && (
                            <span className="block text-[12px] font-semibold text-[#5A6B63]">
                              on {next.horse}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </FaCard>
              </Link>
            );
          })}
        </div>
      )}
      <p className={`mt-2.5 ${FA_MUTED}`}>
        Tap a ring for its full order of go and placings on the Schedule tab.
      </p>

      <SectionLabel>Staff on site</SectionLabel>
      {staff.length === 0 ? (
        <EmptyState title="Nobody staffed" note="No staff assigned to this show yet." />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th className={FA_TH}>Name</th>
                <th className={FA_TH}>Role</th>
                <th className={FA_TH}>Phone</th>
                <th className={FA_TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id} className={FA_TR}>
                  <td className={`${FA_TD} font-bold`}>{person.name}</td>
                  <td className={FA_TD}>
                    <Pill tone="blue">{person.role}</Pill>
                  </td>
                  <td className={`${FA_TD} text-[#5A6B63]`}>{person.phone ?? '—'}</td>
                  <td className={FA_TD}>
                    {person.accepted ? (
                      <Pill tone="green">Active</Pill>
                    ) : (
                      <Pill tone="yellow">Not accepted</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={`mt-2.5 ${FA_MUTED}`}>
        Rider, horse, stabling, and vendor detail each have their own tab in the sidebar — the count
        boxes above jump straight there.
      </p>
    </div>
  );
}
