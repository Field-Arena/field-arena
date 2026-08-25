import type { ReactNode } from 'react';
import type { ShowListItem } from '@/modules/shows/data/queries';
import { ShowPickerCombobox } from './show-picker-combobox';

export function WorkspacePage({
  title,
  description,
  orgName,
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
  return (
    <>
      <div className="dash-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions}
      </div>

      <div className="dash-card">
        <div className="showbar">
          <span className="showbar-org">{orgName}</span>

          {showPicker && shows && shows.length > 0 && currentShow && (
            <ShowPickerCombobox shows={shows} currentShow={currentShow} />
          )}
        </div>

        {children}
      </div>
    </>
  );
}

export function EmptyPanel({ title, note }: { title: string; note: string }) {
  return (
    <div className="placeholder-panel" style={{ marginTop: 14 }}>
      <span className="ph-title">{title}</span>
      <p className="ph-note">{note}</p>
    </div>
  );
}
