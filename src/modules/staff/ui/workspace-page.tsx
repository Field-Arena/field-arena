import type { ReactNode } from 'react';
import type { ShowListItem } from '@/modules/shows/types';
import { EmptyState, PageHeader } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';

export function WorkspacePage({
  title,
  description,
  shows,
  currentShow,
  showPicker = true,
  actions,
  children,
}: {
  title: string;
  description: string;
  orgName: string;
  shows?: ShowListItem[];
  currentShow?: ShowListItem | null;
  showPicker?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const picker =
    showPicker && shows && shows.length > 0 && currentShow ? (
      <FaShowSelect shows={shows} currentRef={currentShow.slug ?? currentShow.id} />
    ) : null;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow={description}
        title={title}
        actions={
          actions === undefined && picker === null ? undefined : (
            <>
              {actions}
              {picker}
            </>
          )
        }
      />
      {children}
    </div>
  );
}

export function EmptyPanel({ title, note }: { title: string; note: string }) {
  return (
    <div className="mt-3.5">
      <EmptyState title={title} note={note} />
    </div>
  );
}
