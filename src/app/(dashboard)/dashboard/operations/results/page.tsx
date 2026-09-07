import type { Metadata } from 'next';
import { listMyShows, listSchedule, listPastShowResults } from '@/modules/operations/data/queries';
import { ResultsBoard } from '@/modules/operations/ui/results-board';
import { OpsClock } from '@/modules/operations/ui/ops-clock';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function OperationsResultsPage({
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
            <h1>Results</h1>
            <p>Live placings and past show results.</p>
          </div>
        </div>
        <div className="dash-card">
          <EmptyPanel
            title="No shows assigned"
            note="You are not staffed on any show yet. An organizer adds show staff from ShowManager."
          />
        </div>
      </>
    );
  }

  const [classes, pastShows] = await Promise.all([
    listSchedule(currentShow.id),
    listPastShowResults(),
  ]);

  // The live show is its own option in the picker — don't repeat it in the
  // past list if it has already ended.
  const past = pastShows.filter((s) => s.showId !== currentShow.id);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Results</h1>
          <p>Best scores of the day by discipline, then placings class by class.</p>
        </div>
        <OpsClock className="dash-clock" />
      </div>

      <div className="dash-card">
        <ResultsBoard liveShowName={currentShow.name} liveClasses={classes} pastShows={past} />
      </div>
    </>
  );
}
