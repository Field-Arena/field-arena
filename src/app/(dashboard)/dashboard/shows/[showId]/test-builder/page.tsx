import type { Metadata } from 'next';
import { getTestBuilderPageData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { TestBuilderCard } from '@/modules/shows/ui/show-manager/test-builder-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Test Builder — Field & Arena' };

/**
 * Show Manager, Test Builder tab: /dashboard/shows/[showId]/test-builder.
 *
 * The library itself is org-scoped (the same test gets reused across shows),
 * but the tab is reached through one show's Show Manager, so this still reads
 * that show directly rather than through getOrganizerContext(showId) — same
 * reasoning as the rest of Show Manager.
 */
export default async function TestBuilderPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const data = await getTestBuilderPageData(showId);

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  return (
    <ShowManagerShell showId={data.showId} showName={data.showName} activeTab="Test Builder">
      <TestBuilderCard orgId={data.orgId} templates={data.templates} />
    </ShowManagerShell>
  );
}
