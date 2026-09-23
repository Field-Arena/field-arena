import type { Metadata } from 'next';
import { getTestBuilderPageData } from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { TestBuilderCard } from '@/modules/shows/ui/show-manager/test-builder-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';

export const metadata: Metadata = { title: 'Test Builder — Field & Arena' };

export default async function TestBuilderPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const data = id ? await getTestBuilderPageData(id) : null;

  if (!data) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [context, vitals] = await Promise.all([
    getOrganizerContext(data.showId),
    getShowManagerVitals(data.showId),
  ]);

  return (
    <ShowManagerShell
      showId={showId}
      showName={data.showName}
      activeTab="Test Builder"
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <TestBuilderCard
        orgId={data.orgId}
        templates={data.templates}
        catalog={data.catalog}
        classes={data.classes}
        assignedByTemplateId={data.assignedByTemplateId}
        assignedByTemplateName={data.assignedByTemplateName}
      />
    </ShowManagerShell>
  );
}
