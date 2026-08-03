import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getHorsesPageData } from '@/modules/shows/data/horses-queries';
import { normalizeStableChart, summarizeStableChart } from '@/modules/shows/data/stable-chart-queries';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspaceHeader } from '@/shared/ui/organizer/workspace-header';
import { HorsesScreen } from '@/modules/shows/ui/horses/horses-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';

export const metadata: Metadata = { title: 'Horses — Field & Arena' };

/**
 * Every horse entered in the show, and what paperwork is still outstanding —
 * a full rebuild off the bare scaffold this page used to be (raw inline
 * `createServerClient()` reads, a plain read-only table, no KPIs, no sort, no
 * per-document detail, no "+ Add Horse", no reminder action). See
 * `modules/shows/data/horses-queries.ts` for the row-building logic (kept and
 * extended from the previous version of this page) and
 * `modules/shows/ui/horses/horses-screen.tsx` for the screen itself.
 *
 * Unlike Users/Venues, which went org-wide, Horses stays genuinely per-show —
 * documents are checked against one show's own `document_requirements`, so
 * there is no sensible org-wide version of this screen. `?show=` and the
 * WorkspaceHeader chrome are wired exactly like users/page.tsx and
 * venues/page.tsx.
 */
export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel title="No shows yet" note="Horses are listed per show." />
      </div>
    );
  }

  const supabase = await createServerClient();
  const [{ stats, stage }, showRow, horsesData] = await Promise.all([
    getShowManagerVitals(context.currentShow.id),
    supabase.from('shows').select('locations, stable_chart').eq('id', context.currentShow.id).single(),
    getHorsesPageData(context.currentShow.id),
  ]);

  if (!horsesData) {
    return (
      <div className="font-[family-name:var(--font-ar)] text-ink-deep">
        <EmptyPanel title="Show not found" note="This show may have been removed." />
      </div>
    );
  }

  const rings = ((showRow.data?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);

  const stableChartSummary = summarizeStableChart(normalizeStableChart(showRow.data?.stable_chart));

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <WorkspaceHeader
        orgName={context.orgName}
        shows={context.shows}
        currentShow={context.currentShow}
        stage={stage}
        stats={stats}
        canViewMoney={context.canViewMoney}
        rings={rings}
        newShowSlot={<NewShowButton className="px-[15px] py-2.5 text-[13px]" />}
      />

      <HorsesScreen data={horsesData} stableChartSummary={stableChartSummary} />
    </div>
  );
}
