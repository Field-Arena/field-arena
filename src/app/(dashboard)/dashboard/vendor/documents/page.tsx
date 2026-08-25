import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { VendorDocumentRow } from '@/modules/vendors/ui/vendor-document-row';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function VendorDocumentsPage() {
  const bookings = await listMyBookings();
  const withRequirements = bookings.filter((b) => b.vendorDocumentRequirements.length > 0);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Documents</h1>
          <p>Paperwork your organizers require before load-in.</p>
        </div>
      </div>

      <div className="dash-card">
        {withRequirements.length === 0 ? (
          <EmptyPanel
            title="Nothing required yet"
            note="No document requirements have been set up for your shows yet."
          />
        ) : (
          withRequirements.map((booking) => (
            <div
              key={booking.id}
              className="card-row"
              style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: 14 }}
            >
              <div className="card-title" style={{ marginBottom: 8 }}>
                {booking.showName}
              </div>
              <div className="doc-list">
                {booking.vendorDocumentRequirements.map((req) => (
                  <VendorDocumentRow
                    key={req.id}
                    bookingId={booking.id}
                    requirement={req}
                    upload={booking.documentUploads.find((d) => d.requirementId === req.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
