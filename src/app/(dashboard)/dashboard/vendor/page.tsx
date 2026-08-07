import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { confirmVendorCheckoutSession } from '@/modules/vendors/data/mutations';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';
import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';
import { VendorAgreementDialog } from '@/modules/vendors/ui/vendor-agreement-dialog';
import { VendorPayButton } from '@/modules/vendors/ui/vendor-pay-button';
import { VendorCheckoutConfirmation } from '@/modules/vendors/ui/vendor-checkout-confirmation';

export const metadata: Metadata = { title: 'My Bookings — Field & Arena' };

/** Client-preview only — the real total is priced server-side at "Pay now" time by data/checkout.ts's priceVendorBooking. Same all-in-flat-8% formula, just computed from the plain catalog prices listMyBookings already returns. */
function previewAmountDue(items: { qty: number; price: number }[]): number {
  return items.reduce((sum, item) => sum + item.qty * (item.price + calcPlatformFeeFlat8(item.price)), 0);
}

/**
 * "My Bookings" — ported from vendor.html's first tab: booth space reserved
 * across every organizer and show. Booth browsing/applying moved to its own
 * page at /dashboard/vendor/discover, matching this workspace's nav (each
 * ROLE_NAV entry is its own route, same as Judge/Announcer's split).
 *
 * `?booking=<id>&checkoutSession=<id>` (Stripe's success_url, set in
 * createVendorCheckoutSession) short-circuits the page into a confirmation
 * view, resolved server-side — same pattern as
 * app/rider/shows/[showId]/page.tsx's own return-from-Stripe handling.
 * `?checkoutCanceled=1` (Stripe's cancel_url) is a quieter notice on top of
 * the normal bookings list, not a separate screen.
 *
 * A vendor's identity is platform-wide rather than tied to one organizer, so
 * this is not scoped to an organization.
 */
export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; checkoutSession?: string; checkoutCanceled?: string }>;
}) {
  const { booking: confirmBookingId, checkoutSession: checkoutSessionId, checkoutCanceled } =
    await searchParams;

  if (confirmBookingId && checkoutSessionId) {
    const result = await confirmVendorCheckoutSession({
      bookingId: confirmBookingId,
      sessionId: checkoutSessionId,
    });
    return (
      <>
        <div className="dash-head">
          <div>
            <h1>My Bookings</h1>
          </div>
        </div>
        <VendorCheckoutConfirmation result={result} />
      </>
    );
  }

  const bookings = await listMyBookings();

  const paid = bookings.filter((b) => b.status === 'paid').length;
  const spend = bookings.reduce((sum, b) => sum + (b.amountTotal ?? 0), 0);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>My Bookings</h1>
          <p>Your booth space across every organizer on the platform.</p>
        </div>
      </div>

      {checkoutCanceled === '1' && (
        <div className="dash-card" style={{ color: 'var(--amber)' }}>
          Checkout was canceled — nothing was charged.
        </div>
      )}

      <div className="dash-card">
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <div className="stat">
            <div className="stat-label">Bookings</div>
            <div className="stat-value">{bookings.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Paid</div>
            <div className="stat-value">{paid}</div>
          </div>
          <div className="stat revenue">
            <div className="stat-label">Total booked</div>
            <div className="stat-value">{formatMoney(spend)}</div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <EmptyPanel
            title="No bookings yet"
            note="Reserve booth space from Reserve Space, or apply directly through an organizer's vendor application."
          />
        ) : (
          <div className="cards" style={{ marginTop: 14 }}>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`card-row ${booking.status === 'paid' ? 'confirmed' : 'pending'}`}
              >
                <div className="card-main">
                  <div className="card-title">{booking.showName}</div>
                  <div className="card-meta">
                    {booking.orgName} · {booking.showDate ?? 'Dates not set'}
                  </div>
                  {booking.items.length > 0 && (
                    <div className="b-items">
                      {booking.items.map((item) => (
                        <div key={item.name} className="b-item-row">
                          <span>
                            {item.name}
                            {item.qty > 1 && ` x${String(item.qty)}`}
                          </span>
                          <span className="amt">{formatMoney(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {booking.status === 'paid' ? (
                    <StatusBadge tone="success">Paid</StatusBadge>
                  ) : booking.status === 'approved' ? (
                    <StatusBadge tone="info">Approved — awaiting payment</StatusBadge>
                  ) : booking.status === 'rejected' ? (
                    <StatusBadge tone="danger">Rejected</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn">Pending review</StatusBadge>
                  )}
                  {booking.amountTotal !== null && (
                    <div className="card-meta" style={{ marginTop: 6 }}>
                      {formatMoney(booking.amountTotal)}
                    </div>
                  )}
                  {booking.paidAt && (
                    <div className="card-meta">paid {formatTimestamp(booking.paidAt)}</div>
                  )}

                  {booking.status !== 'rejected' && (
                    <div style={{ marginTop: 8 }}>
                      {booking.agreementSignedAt ? (
                        <div className="card-meta">agreement signed</div>
                      ) : (
                        <VendorAgreementDialog
                          bookingId={booking.id}
                          showName={booking.showName}
                          agreementText={booking.vendorAgreementText}
                        />
                      )}
                    </div>
                  )}

                  {booking.status === 'approved' && (
                    <div style={{ marginTop: 8 }}>
                      {booking.agreementSignedAt ? (
                        // Mirrors legacy's own waiver-style gate (vendor.html's
                        // openRealPay): a vendor must sign the booth agreement
                        // before payment is offered.
                        <VendorPayButton
                          bookingId={booking.id}
                          amountDue={previewAmountDue(booking.items)}
                        />
                      ) : (
                        <div className="card-meta" style={{ color: 'var(--amber)' }}>
                          sign the booth agreement above to pay
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
