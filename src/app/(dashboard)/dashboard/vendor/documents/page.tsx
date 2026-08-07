import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { VendorDocumentRow } from '@/modules/vendors/ui/vendor-document-row';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

/**
 * "Documents" — ported from vendor.html's third tab: one row per this show's
 * organizer-defined vendor_document_requirements item, with a real upload/
 * view/delete backed by vendor-docs storage (registerVendorDocument /
 * removeVendorDocument). Only bookings whose show actually has requirements
 * set up appear here, same as legacy's own `withReqs` filter — organizer-side
 * load-in guides and venue maps live on the show itself, not per-vendor, and
 * have no upload UI here to port (legacy's own static list for those was
 * demo-only content, never real data).
 */
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
