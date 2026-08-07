import type { ReactNode } from 'react';
import type { ShowListItem } from '@/modules/shows/data/queries';
import { ShowPickerCombobox } from './show-picker-combobox';

/**
 * Shared chrome for the organizer workspace's sub-pages: a title, a description,
 * and — for show-scoped pages — the show picker.
 *
 * The picker itself (`ShowPickerCombobox`) is the one client-side piece in an
 * otherwise plain Server Component — see that file for why a real listbox
 * replaced the previous native `<select>` + GET-form pair. The selected show
 * still lives in the `?show=` URL param either way, so a particular show's
 * page stays linkable and back-button-friendly.
 */
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

/** A page whose data has not arrived yet, said plainly rather than left blank. */
export function EmptyPanel({ title, note }: { title: string; note: string }) {
  return (
    <div className="placeholder-panel" style={{ marginTop: 14 }}>
      <span className="ph-title">{title}</span>
      <p className="ph-note">{note}</p>
    </div>
  );
}
