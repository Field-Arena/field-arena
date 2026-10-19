import type { Metadata } from 'next';
import { listMyShows, listSchedule, listPastShowResults } from '@/modules/operations/data/queries';
import { ResultsBoard } from '@/modules/operations/ui/results-board';
import { OpsClock } from '@/modules/operations/ui/ops-clock';
import { OPS_CLOCK_CLASS, OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Results — Field & Arena' };

export default async function OperationsResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Live placings and past show results" title="Results" />;
  }

  const [classes, pastShows] = await Promise.all([
    listSchedule(currentShow.id),
    listPastShowResults(),
  ]);

  // The live show is its own option in the picker — don't repeat it in the
  // past list if it has already ended.
  const past = pastShows.filter((s) => s.showId !== currentShow.id);

  return (
    <div className={OPS_WRAP}>
      <PageHeader
        eyebrow="Best scores of the day by discipline, then placings class by class"
        title="Results"
        actions={<OpsClock className={OPS_CLOCK_CLASS} />}
      />
      <ResultsBoard liveShowName={currentShow.name} liveClasses={classes} pastShows={past} />
    </div>
  );
}
