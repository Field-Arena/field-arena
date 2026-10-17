import { FA_MUTED, Pill } from '@/shared/ui/organizer/fa-page';
import { FaShowSelect } from '@/shared/ui/organizer/fa-show-select';
import type { AnnouncerShow } from '@/modules/announcements/data/queries';

/* Legacy's assignment cards carried a Today / Upcoming / Completed pill
 * (announcer.html:319 pillFor) — on a show day the announcer could see at a
 * glance that the board in front of them was the show actually running. The
 * switcher dropdown alone lost that signal entirely. */
function StatusPill({ status }: { status: AnnouncerShow['status'] }) {
  if (status === 'today') return <Pill tone="green">Today</Pill>;
  if (status === 'completed') return <Pill tone="grey">Completed</Pill>;
  return <Pill tone="blue">Upcoming</Pill>;
}

const STATUS_SUFFIX: Record<AnnouncerShow['status'], string> = {
  today: ' — today',
  completed: ' — completed',
  upcoming: '',
};

export function ShowSwitcher({
  currentShow,
  shows,
}: {
  currentShow: AnnouncerShow;
  shows: AnnouncerShow[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shows.length < 2 && (
        <span className="text-[14px] font-bold text-[#0D2C23]">{currentShow.name}</span>
      )}
      <StatusPill status={currentShow.status} />
      {currentShow.dateLabel && <span className={FA_MUTED}>{currentShow.dateLabel}</span>}
      <FaShowSelect
        shows={shows.map((show) => ({
          id: show.id,
          slug: show.slug,
          name: `${show.name}${STATUS_SUFFIX[show.status]}`,
        }))}
        currentRef={currentShow.slug ?? currentShow.id}
        label="Select show"
      />
    </div>
  );
}
