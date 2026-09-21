import { WorkspacePageSkeleton } from '@/shared/ui/console-skeletons';

export default function RiderShowLoading() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <WorkspacePageSkeleton cards={4} />
    </main>
  );
}
