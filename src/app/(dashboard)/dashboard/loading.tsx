import { WorkspacePageSkeleton } from '@/shared/ui/console-skeletons';

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading workspace" aria-busy="true">
      <span className="sr-only">Loading workspace…</span>
      <div aria-hidden="true">
        <WorkspacePageSkeleton />
      </div>
    </div>
  );
}
