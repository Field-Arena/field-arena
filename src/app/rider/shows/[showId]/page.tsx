import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isUuid } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';
import {
  getCurrentRiderProfile,
  getPublicShowForRider,
  getWaiverSignature,
  listRiderEntriesForShow,
  listRiderHorses,
  listRiderOrdersForShow,
} from '@/modules/riders/data/queries';
import { confirmCheckoutSession } from '@/modules/riders/data/mutations';
import { parseDocumentRequirements } from '@/modules/riders/utils/parse-document-requirements';
import { ShowTicketDetail } from '@/modules/riders/ui/show-ticket-detail';
import { WaiverForm } from '@/modules/riders/ui/waiver-form';
import { RiderDetailsForm } from '@/modules/riders/ui/rider-details-form';
import { HorseManager } from '@/modules/riders/ui/horse-manager';
import { ClassPicker } from '@/modules/riders/ui/class-picker';
import { AddOnPicker } from '@/modules/riders/ui/addon-picker';
import { ClassHorseAssignment } from '@/modules/riders/ui/class-horse-assignment';
import { CheckoutSummary } from '@/modules/riders/ui/checkout-summary';
import { CheckoutConfirmation } from '@/modules/riders/ui/checkout-confirmation';
import { RiderShowDashboard } from '@/modules/riders/ui/rider-show-dashboard';

export const metadata: Metadata = { title: 'Show — Field & Arena' };

export default async function RiderShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ showId: string }>;
  searchParams: Promise<{ order?: string; checkoutSession?: string; checkoutCanceled?: string }>;
}) {
  const { showId } = await params;
  if (!isUuid(showId)) notFound();

  const detail = await getPublicShowForRider(showId);
  if (!detail) notFound();

  const rider = await getCurrentRiderProfile();

  if (!rider) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <ShowTicketDetail detail={detail} />
        <div className="border-line bg-mint text-forest rounded-lg border p-4 text-sm">
          <Link href={ROUTES.rider} className="font-semibold underline underline-offset-2">
            Sign in or create an account
          </Link>{' '}
          to enter classes at this show.
        </div>
      </main>
    );
  }

  const {
    order: orderId,
    checkoutSession: checkoutSessionId,
    checkoutCanceled,
  } = await searchParams;
  if (orderId && checkoutSessionId) {
    const result = await confirmCheckoutSession({ orderId, sessionId: checkoutSessionId });
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <CheckoutConfirmation result={result} showId={showId} />
      </main>
    );
  }

  const documentRequirements = parseDocumentRequirements(detail.show.document_requirements);

  const entries = await listRiderEntriesForShow(showId);
  if (entries.length > 0) {
    const [orders, horses] = await Promise.all([listRiderOrdersForShow(showId), listRiderHorses()]);
    return (
      <RiderShowDashboard
        rider={rider}
        show={detail.show}
        venueAddress={detail.venueAddress}
        classes={detail.classes}
        addOns={detail.addOns}
        entries={entries}
        orders={orders}
        horses={horses}
        documentRequirements={documentRequirements}
      />
    );
  }

  const [horses, waiverSignature] = await Promise.all([
    listRiderHorses(),
    getWaiverSignature(showId),
  ]);

  const waiverText = detail.show.waiver_text?.trim() ?? null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-forest text-2xl font-semibold">{detail.show.name}</h1>
        <p className="text-fa-muted text-sm">
          {[detail.show.date_label, detail.show.venue_name].filter(Boolean).join(' · ')}
        </p>
      </div>

      {checkoutCanceled === '1' && (
        <div className="border-line rounded-lg border bg-amber-50 p-4 text-sm text-amber-900">
          Checkout was canceled — nothing was charged. Your selections below are unchanged.
        </div>
      )}

      {waiverText && (
        <WaiverForm showId={showId} waiverText={waiverText} existingSignature={waiverSignature} />
      )}

      <RiderDetailsForm rider={rider} />

      <HorseManager horses={horses} documentRequirements={documentRequirements} />

      <ClassPicker classes={detail.classes} qualTypes={detail.qualTypes} />

      <AddOnPicker addOns={detail.addOns} />

      <ClassHorseAssignment classes={detail.classes} horses={horses} />

      <CheckoutSummary
        showId={showId}
        classes={detail.classes}
        addOns={detail.addOns}
        qualTypes={detail.qualTypes}
        waiverSatisfied={!waiverText || !!waiverSignature}
      />
    </main>
  );
}
