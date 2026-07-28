import type { ReactNode } from 'react';
import type { ShowListItem } from '@/modules/shows/data/queries';

/**
 * Shared chrome for the organizer workspace's sub-pages: a title, a description,
 * and — for show-scoped pages — the show picker.
 *
 * The picker is a plain GET form so switching shows needs no JavaScript and the
 * page stays a Server Component. The selected show lives in the URL, which also
 * makes a particular show's page linkable and back-button-friendly.
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
            <form method="get" className="contents">
              <select
                name="show"
                defaultValue={currentShow.id}
                className="dash-select"
                style={{ maxWidth: 380 }}
                aria-label="Select show"
              >
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                    {show.dateLabel ? ` (${show.dateLabel})` : ''}
                  </option>
                ))}
              </select>
              <button type="submit" className="dash-btn dash-btn-outline">
                Switch
              </button>
            </form>
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
