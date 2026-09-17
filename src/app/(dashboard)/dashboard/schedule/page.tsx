import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import {
  getMasterSchedule,
  getShowSetupDetail,
  listClasses,
} from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { MasterScheduleView } from '@/modules/shows/ui/schedule/master-schedule-view';
import { SchedulePreferencesCard } from '@/modules/shows/ui/show-manager/schedule-preferences-card';

export const metadata: Metadata = { title: 'Master Schedule — Field & Arena' };

export default async function MasterSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Master Schedule"
        description="The master schedule for your currently focused show."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel
          title="No Show Selected"
          note="Pick a show above — Schedule shows the master schedule for whichever show is currently focused."
        />
      </WorkspacePage>
    );
  }

  const [data, showDetail, classes] = await Promise.all([
    getMasterSchedule(context.currentShow.id),
    getShowSetupDetail(context.currentShow.id),
    listClasses(context.currentShow.id),
  ]);
  const hasRides = data?.schedule.arenas.some((a) => a.items.some((it) => it.type === 'ride'));

  return (
    <WorkspacePage
      title="Master Schedule"
      description="The master schedule for your currently focused show."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      {!data || !hasRides ? (
        data?.schedule.tooLarge ? (
          <EmptyPanel
            title="This show's class list looks wrong"
            note={`${context.currentShow.name} has ${String(data.schedule.tooLarge)} scheduled rides — far more than a real show should ever have. This is very likely duplicated classes rather than a real schedule, so it hasn't been built. Check Select Events and remove anything that shouldn't be there.`}
          />
        ) : (
          <EmptyPanel
            title="This show hasn't built a schedule yet"
            note={`${context.currentShow.name} doesn't have any classes with entries scheduled yet. Once riders are entered, the built schedule appears here automatically.`}
          />
        )
      ) : (
        <>
          {/* Pacing/order/lunch/day-time preferences moved here from Setup —
              client feedback: deciding these before any entries exist is
              premature, they only make sense once there's a real schedule to
              tune (client's own words: "should be made after the entries
              are done"). This page already gates everything below on
              hasRides, which is exactly that condition. */}
          {showDetail && (
            <SchedulePreferencesCard
              showId={context.currentShow.id}
              startDate={showDetail.startDate}
              endDate={showDetail.endDate}
              prefs={showDetail.schedulePrefs}
              dayStartTimes={showDetail.dayStartTimes}
              dayEndTimes={showDetail.dayEndTimes}
              classes={classes}
            />
          )}
          <MasterScheduleView data={data} />
        </>
      )}
    </WorkspacePage>
  );
}
