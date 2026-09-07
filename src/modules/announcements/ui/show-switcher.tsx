import { StatusBadge } from '@/shared/ui/status-badge';
import type { AnnouncerShow } from '@/modules/announcements/data/queries';

/* Legacy's assignment cards carried a Today / Upcoming / Completed pill
 * (announcer.html:319 pillFor) — on a show day the announcer could see at a
 * glance that the board in front of them was the show actually running. The
 * switcher dropdown alone lost that signal entirely. */
function StatusPill({ status }: { status: AnnouncerShow['status'] }) {
  if (status === 'today') return <StatusBadge tone="warn">Today</StatusBadge>;
  if (status === 'completed') return <StatusBadge tone="neutral">Completed</StatusBadge>;
  return <StatusBadge tone="success">Upcoming</StatusBadge>;
}

export function ShowSwitcher({
  currentShow,
  shows,
}: {
  currentShow: AnnouncerShow;
  shows: AnnouncerShow[];
}) {
  return (
    <div className="showbar">
      <span className="showbar-org">{currentShow.name}</span>
      <StatusPill status={currentShow.status} />
      {currentShow.dateLabel && <span className="card-meta">{currentShow.dateLabel}</span>}
      {shows.length > 1 && (
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
                {show.status === 'today' ? ' — today' : ''}
                {show.status === 'completed' ? ' — completed' : ''}
              </option>
            ))}
          </select>
          <button type="submit" className="dash-btn dash-btn-outline">
            Switch
          </button>
        </form>
      )}
    </div>
  );
}
