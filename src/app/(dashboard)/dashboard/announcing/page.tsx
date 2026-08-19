import type { Metadata } from 'next';
import { getRingStatus, listMyShows } from '@/modules/announcements/data/queries';
import { ShowSwitcher } from '@/modules/announcements/ui/show-switcher';
import { ActiveRingsPanel } from '@/modules/announcements/ui/active-rings-panel';
import { AllRingsTable } from '@/modules/announcements/ui/all-rings-table';
import { ANNOUNCING_RESULTS_PATH } from '@/modules/announcements/constants';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Up Next — Field & Arena' };

export default async function AnnouncingPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow = shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>Up Next</h1>
            <p>Ring status, running order and live results.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds an announcer from ShowManager."
          />
        </div>
      </>
    );
  }

  const rings = await getRingStatus(currentShow.id);
  const liveRings = rings.filter((r) => r.scoringOpen);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Up Next</h1>
          <p>Ring status, running order and live results.</p>
        </div>
      </div>

      <div className="dash-card">
        <ShowSwitcher currentShow={currentShow} shows={shows} />

        <ActiveRingsPanel liveRings={liveRings} />
        <AllRingsTable rings={rings} />

        <p style={{ marginTop: 26 }}>
          <a
            href={`${ANNOUNCING_RESULTS_PATH}?show=${currentShow.id}`}
            className="dash-btn dash-btn-outline"
          >
            View results — live →
          </a>
        </p>
      </div>
    </>
  );
}
