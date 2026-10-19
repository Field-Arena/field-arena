import { NewShowButton } from '@/modules/shows/ui/show-manager/new-show-button';
import type { DashboardShowRow } from '@/modules/shows/types';
import { HomeBoard, type HomeShow } from './home-board';
import { ShowPicker } from './show-picker';

export type { HomeShow } from './home-board';
export { STAGE_LABEL, approvalTone, whenLabel } from './dashboard-format';

/** The organizer's landing view: three show boxes (soonest first) that open
 * a show's details when clicked, a picker for any show, and one to-do list. */
export function DashboardHome({
  orgName,
  shows,
  upcomingShows,
  finishedShows,
  canViewMoney,
}: {
  orgName: string;
  shows: HomeShow[];
  upcomingShows: DashboardShowRow[];
  finishedShows: DashboardShowRow[];
  canViewMoney: boolean;
}) {
  if (shows.length === 0) {
    return (
      <section>
        <h1 className="m-0 text-[32px] font-bold text-[#0D2C23]">Your shows</h1>
        <div className="mt-5 rounded-2xl border-[1.5px] border-[#C9D3CE] bg-white p-6">
          <h2 className="m-0 text-[20px] font-bold text-[#0D2C23]">No current shows</h2>
          <p className="mt-1.5 mb-4 text-[15px] text-[#5A6B63]">
            {orgName} has nothing coming up. Create a show, or open a finished one below.
          </p>
          <NewShowButton />
        </div>
        {finishedShows.length > 0 && (
          <div className="mt-6">
            <ShowPicker upcoming={upcomingShows} finished={finishedShows} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[30px] leading-tight font-bold text-[#0D2C23]">Your shows</h1>
          <p className="mt-1 mb-0 text-[14.5px] text-[#5A6B63]">
            Click a show to open its details below. Click it again to close.
          </p>
        </div>
        <NewShowButton />
      </div>
      <HomeBoard
        shows={shows}
        upcomingShows={upcomingShows}
        finishedShows={finishedShows}
        canViewMoney={canViewMoney}
      />
    </section>
  );
}
