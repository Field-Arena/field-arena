import type { Metadata } from 'next';
import { listMyShows } from '@/modules/operations/data/queries';
import { OPS_WRAP, OpsNoShows } from '@/modules/operations/ui/ops-page';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import {
  normalizeStableChart,
  summarizeStableChart,
} from '@/modules/shows/data/stable-chart-queries';
import { HorsesScreen } from '@/modules/shows/ui/horses/horses-screen';
import { createServerClient } from '@/shared/lib/supabase/server';
import { EmptyState } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export const metadata: Metadata = { title: 'Horses — Field & Arena' };

/* Show staff get the organizer's Horses page, read-only. Staff on a show can
 * read everything it needs under RLS (can_view_show covers shows, classes and
 * class_entries; horses/riders via horse_/rider_in_viewable_show; the
 * horse-documents bucket via fa_horse_docs_staff_read). */
export default async function OperationsHorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const shows = await listMyShows();
  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  if (!currentShow) {
    return <OpsNoShows eyebrow="Every horse entered in this show" title="Horses" />;
  }

  const publicId = currentShow.slug ?? currentShow.id;
  const supabase = await createServerClient();
  const [showRow, horsesData] = await Promise.all([
    supabase.from('shows').select('stable_chart').eq('id', currentShow.id).single(),
    getHorsesPageData(currentShow.id),
  ]);

  if (!horsesData) {
    return (
      <div className={OPS_WRAP}>
        <EmptyState title="Show not found" note="This show may have been removed." />
      </div>
    );
  }

  const stableChartSummary = summarizeStableChart(normalizeStableChart(showRow.data?.stable_chart));

  return (
    <div className={OPS_WRAP}>
      {shows.length > 1 && (
        <div className="mb-2 flex justify-end">
          <FaShowSelect shows={shows} currentRef={publicId} />
        </div>
      )}
      <HorsesScreen
        data={horsesData}
        stableChartSummary={stableChartSummary}
        publicId={publicId}
        readOnly
      />
    </div>
  );
}
