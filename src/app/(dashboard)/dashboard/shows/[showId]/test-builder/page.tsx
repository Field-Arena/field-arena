import type { Metadata } from 'next';
import { getTestBuilderPageData } from '@/modules/shows/data/setup-queries';
import { TestBuilderCard } from '@/modules/shows/ui/show-manager/test-builder-card';
import { SelectedClassesCard } from '@/modules/shows/ui/show-manager/selected-classes-card';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';

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

  return (
    <>
      <SelectedClassesCard classes={data.selectedClasses} />
      <TestBuilderCard
        orgId={data.orgId}
        templates={data.templates}
        catalog={data.catalog}
        classes={data.classes}
        assignedByTemplateId={data.assignedByTemplateId}
      />
    </>
  );
}
