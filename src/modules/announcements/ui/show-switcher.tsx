import type { AnnouncerShow } from '@/modules/announcements/data/queries';

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
