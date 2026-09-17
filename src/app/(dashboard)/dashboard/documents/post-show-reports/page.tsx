import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { StubPlaceholder } from '@/modules/shows/ui/filing-cabinet/stub-placeholder';

export const metadata: Metadata = { title: 'Post-Show Reports — Field & Arena' };

export default async function PostShowReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  return (
    <FilingCabinetShell
      activeKey="post-show-reports"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <StubPlaceholder label="Post-Show Reports" />
    </FilingCabinetShell>
  );
}
