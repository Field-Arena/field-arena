import type { ReactNode } from 'react';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ShowListItem } from '@/modules/shows/data/queries';
import { FilingCabinetTabs } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-tabs';
import type { FilingCabinetSectionKey } from '@/modules/shows/constants';

export function FilingCabinetShell({
  activeKey,
  orgName,
  shows,
  currentShow,
  children,
}: {
  activeKey: FilingCabinetSectionKey;
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  children: ReactNode;
}) {
  return (
    <WorkspacePage
      title="Documents"
      description="The filing cabinet — entries, memberships, document review, issues, numbering and printing, all from the same records as the rest of the show"
      orgName={orgName}
      shows={shows}
      currentShow={currentShow}
    >
      <div className="print:hidden">
        <FilingCabinetTabs
          activeKey={activeKey}
          showId={currentShow ? (currentShow.slug ?? currentShow.id) : null}
        />
      </div>

      {currentShow ? (
        children
      ) : (
        <EmptyPanel title="No shows yet" note="The filing cabinet is configured per show." />
      )}
    </WorkspacePage>
  );
}
