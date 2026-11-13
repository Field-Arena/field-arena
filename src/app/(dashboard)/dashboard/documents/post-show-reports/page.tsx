import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { getPostShowReport } from '@/modules/results-export/data/get-report-summary';
import { PostShowReportScreen } from '@/modules/results-export/ui/post-show-report-screen';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { createServerClient } from '@/shared/lib/supabase/server';

export const metadata: Metadata = { title: 'Post-Show Reports — Field & Arena' };

export default async function PostShowReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);
  const show = context.currentShow;

  const report = show ? await getPostShowReport(show.id) : null;

  // The export route re-checks this on every download; this only decides
  // whether the buttons are shown.
  let canExport = false;
  if (show) {
    const supabase = await createServerClient();
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: show.id,
      permission_key: 'canExportRoster',
    });
    canExport = allowed === true;
  }

  return (
    <FilingCabinetShell
      activeKey="post-show-reports"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={show}
    >
      {show && report ? (
        <PostShowReportScreen
          report={report}
          showRef={show.slug ?? show.id}
          canExport={canExport}
        />
      ) : (
        <EmptyPanel
          title="Show not found"
          note="This show doesn't exist, or you don't have access to it."
        />
      )}
    </FilingCabinetShell>
  );
}
