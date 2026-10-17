import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { VendorDocumentRow } from '@/modules/vendors/ui/vendor-document-row';
import { CardTitle, EmptyState, FA_MUTED, FaCard, PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function VendorDocumentsPage() {
  const bookings = await listMyBookings();
  const withRequirements = bookings.filter((b) => b.vendorDocumentRequirements.length > 0);

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader eyebrow="Paperwork your organizers require before load-in" title="Documents" />

      {withRequirements.length === 0 ? (
        <EmptyState
          title="Nothing required yet"
          note="No document requirements have been set up for your shows yet."
        />
      ) : (
        <div className="space-y-3.5">
          {withRequirements.map((booking) => (
            <FaCard key={booking.id}>
              <CardTitle>{booking.showName}</CardTitle>
              <p className={FA_MUTED}>
                {booking.orgName} · {booking.showDate ?? 'Dates not set'}
              </p>
              <ul className="mt-3 list-none p-0">
                {booking.vendorDocumentRequirements.map((req) => (
                  <VendorDocumentRow
                    key={req.id}
                    bookingId={booking.id}
                    requirement={req}
                    upload={booking.documentUploads.find((d) => d.requirementId === req.id)}
                  />
                ))}
              </ul>
            </FaCard>
          ))}
        </div>
      )}
    </div>
  );
}
