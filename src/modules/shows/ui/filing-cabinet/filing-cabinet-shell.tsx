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
      description="The filing cabinet — entry ledger, membership checks, document review, issues, numbering, and printing, all reading the same records as the rest of the show."
      orgName={orgName}
      shows={shows}
      currentShow={currentShow}
    >
      <FilingCabinetTabs
        activeKey={activeKey}
        showId={currentShow ? (currentShow.slug ?? currentShow.id) : null}
      />

      {currentShow ? children : <EmptyPanel title="No shows yet" note="The filing cabinet is configured per show." />}
    </WorkspacePage>
  );
}
