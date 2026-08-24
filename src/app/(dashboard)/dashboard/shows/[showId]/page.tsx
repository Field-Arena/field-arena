import type { Metadata } from 'next';
import {
  getShowSetupDetail,
  listVenuesForOrg,
  listDivisions,
  listClasses,
  listStaff,
  getShowCompleteness,
} from '@/modules/shows/data/setup-queries';
import { ShowManagerShell } from '@/modules/shows/ui/show-manager/show-manager-shell';
import { ReadinessMeter } from '@/modules/shows/ui/show-manager/readiness-meter';
import { ShowDetailsCard } from '@/modules/shows/ui/show-manager/show-details-card';
import { VenueCard } from '@/modules/shows/ui/show-manager/venue-card';
import { ContactCard } from '@/modules/shows/ui/show-manager/contact-card';
import { PrizeListCard } from '@/modules/shows/ui/show-manager/prize-list-card';
import { ClassDivisionsCard } from '@/modules/shows/ui/show-manager/class-divisions-card';
import { RequiredDocumentsCard } from '@/modules/shows/ui/show-manager/required-documents-card';
import { MerchandiseCard } from '@/modules/shows/ui/show-manager/merchandise-card';
import { WaiverCard } from '@/modules/shows/ui/show-manager/waiver-card';
import { SchedulePreferencesCard } from '@/modules/shows/ui/show-manager/schedule-preferences-card';
import { ShareShowLink } from '@/modules/shows/ui/show-manager/share-show-link';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import { env } from '@/shared/lib/env';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { isUuid } from '@/shared/lib/utils';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getShowManagerVitals } from '@/modules/shows/data/queries';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = { title: 'Show Manager — Field & Arena' };

export default async function ShowManagerPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const show = isUuid(showId) ? await getShowSetupDetail(showId) : null;

  if (!show) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [venues, divisions, completeness, context, vitals, staff, classes] = await Promise.all([
    listVenuesForOrg(show.orgId),
    listDivisions(show.id),
    getShowCompleteness(show.id),
    getOrganizerContext(show.id),
    getShowManagerVitals(show.id),
    listStaff(show.id),
    listClasses(show.id),
  ]);

  const nextIncompleteSection = completeness.sections.find((s) => !s.ok) ?? null;

  return (
    <ShowManagerShell
      showId={show.id}
      showName={show.name}
      orgName={context.orgName}
      shows={context.shows}
      stats={vitals.stats}
      stage={vitals.stage}
      canViewMoney={context.canViewMoney}
    >
      <ReadinessMeter completeness={completeness} />
      <ShareShowLink
        url={`${env.siteUrl}/show/${show.id}`}
        browseUrl={`${env.siteUrl}${ROUTES.browseShows}`}
      />
      <div id="show-details" className="scroll-mt-24">
        <ShowDetailsCard show={show} />
      </div>
      <div id="venue" className="scroll-mt-24">
        <VenueCard
          showId={show.id}
          venueId={show.venueId}
          locations={show.locations}
          venues={venues}
          staff={staff}
          classes={classes}
        />
      </div>
      <ContactCard
        showId={show.id}
        website={show.website}
        phone={show.phone}
        contactEmail={show.contactEmail}
      />
      <PrizeListCard showId={show.id} prizeListUrl={show.prizeListUrl} />
      <div id="class-divisions" className="scroll-mt-24">
        <ClassDivisionsCard showId={show.id} divisions={divisions} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div id="required-documents" className="scroll-mt-24">
          <RequiredDocumentsCard
            showId={show.id}
            documentRequirements={show.documentRequirements}
          />
        </div>
        <div id="merchandise" className="scroll-mt-24">
          <MerchandiseCard
            showId={show.id}
            merchandiseEnabled={show.merchandiseEnabled}
            merchItems={show.merchItems}
          />
        </div>
      </div>
      <div id="waiver" className="scroll-mt-24">
        <WaiverCard
          showId={show.id}
          waiverText={show.waiverText}
          waiverApprovedText={show.waiverApprovedText}
        />
      </div>
      <SchedulePreferencesCard
        showId={show.id}
        startDate={show.startDate}
        endDate={show.endDate}
        prefs={show.schedulePrefs}
        dayStartTimes={show.dayStartTimes}
        dayEndTimes={show.dayEndTimes}
        classes={classes}
      />
      <SectionFooter
        currentTab="Setup"
        showId={show.id}
        blockedReason={
          nextIncompleteSection
            ? `${nextIncompleteSection.name} still needs attention — see Setup Readiness above.`
            : null
        }
      />
    </ShowManagerShell>
  );
}
