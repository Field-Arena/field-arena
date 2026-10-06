import type { Metadata } from 'next';
import {
  getShowSetupDetail,
  listSharedVenues,
  listDivisions,
  listClasses,
  listStaff,
  completenessFromLoadedShow,
} from '@/modules/shows/data/setup-queries';
import { DraftSummary } from '@/modules/shows/ui/show-manager/draft-summary';
import { getShowStage } from '@/modules/shows/data/queries';
import { ShowDetailsCard } from '@/modules/shows/ui/show-manager/show-details-card';
import { VenueCard } from '@/modules/shows/ui/show-manager/venue-card';
import { ContactCard } from '@/modules/shows/ui/show-manager/contact-card';
import { PrizeListCard } from '@/modules/shows/ui/show-manager/prize-list-card';
import { ClassDivisionsCard } from '@/modules/shows/ui/show-manager/class-divisions-card';
import { MerchandiseCard } from '@/modules/shows/ui/show-manager/merchandise-card';
import { WaiverCard } from '@/modules/shows/ui/show-manager/waiver-card';
import { ShareShowLink } from '@/modules/shows/ui/show-manager/share-show-link';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import { env } from '@/shared/lib/env';
import { EmptyPanel } from '@/shared/ui/workspace-page';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = { title: 'Show Manager — Field & Arena' };

export default async function ShowManagerPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const id = await resolveShowIdParam(showId);
  const show = id ? await getShowSetupDetail(id) : null;

  if (!show) {
    return (
      <EmptyPanel
        title="Show not found"
        note="This show doesn't exist, or you don't have access to it."
      />
    );
  }

  const [venues, divisions, staff, classes, stage] = await Promise.all([
    listSharedVenues(show.orgId),
    listDivisions(show.id),
    listStaff(show.id),
    listClasses(show.id),
    getShowStage(show.id),
  ]);

  const completeness = completenessFromLoadedShow({ show, divisions, classes, staff });
  const nextIncompleteSection = completeness.sections.find((s) => !s.ok) ?? null;

  const publicUrl = `${env.siteUrl}/show/${show.slug ?? show.id}`;

  return (
    <div className="fa-setup-grid">
      <div className="fa-setup-main flex flex-col gap-4">
        <div className="fa-autosave-bar !mb-0">
          <span className="fa-as-dot" />
          Show details save automatically as you complete them — nothing to submit, and everything
          stays editable.
        </div>
        <ShareShowLink url={publicUrl} browseUrl={`${env.siteUrl}${ROUTES.browseShows}`} />
        <div id="show-details" className="flex scroll-mt-24 flex-col gap-4">
          <ShowDetailsCard show={show} />
        </div>
        <div id="venue" className="scroll-mt-24">
          <VenueCard
            showId={show.id}
            publicId={showId}
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
        <div id="merchandise" className="scroll-mt-24">
          <MerchandiseCard
            showId={show.id}
            merchandiseEnabled={show.merchandiseEnabled}
            merchItems={show.merchItems}
          />
        </div>
        <div id="waiver" className="scroll-mt-24">
          <WaiverCard
            showId={show.id}
            waiverText={show.waiverText}
            waiverApprovedText={show.waiverApprovedText}
            waiverDocumentUrl={show.waiverDocumentUrl}
            waiverDocumentName={show.waiverDocumentName}
          />
        </div>
        <SectionFooter
          currentTab="Setup"
          showId={showId}
          blockedReason={
            nextIncompleteSection
              ? `${nextIncompleteSection.name} still needs attention — see the setup summary.`
              : null
          }
          previewUrl={publicUrl}
        />
      </div>
      <aside className="fa-setup-side">
        <DraftSummary
          publicId={showId}
          name={show.name}
          startDate={show.startDate}
          endDate={show.endDate}
          venueName={show.venueName}
          governingBodies={show.governingBodies}
          sections={completeness.sections}
          stage={stage}
          publicUrl={publicUrl}
        />
      </aside>
    </div>
  );
}
