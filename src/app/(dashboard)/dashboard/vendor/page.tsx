import type { Metadata } from 'next';
import { listBookableShows, listMyBookings } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatTimestamp } from '@/shared/lib/format/date';

export const metadata: Metadata = { title: 'My Bookings — Field & Arena' };

/**
 * The vendor dashboard, ported from vendor.html: bookings across every
 * organizer, plus booth space still available.
 *
 * A vendor's identity is platform-wide rather than tied to one organizer, so
 * neither panel is scoped to an organization.
 */
export default async function VendorPage() {
  const [bookings, bookable] = await Promise.all([listMyBookings(), listBookableShows()]);

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
            note="Reserve booth space from the list below, or apply directly through an organizer's vendor application."
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
                  <div className="card-meta">{booking.showDate ?? 'Dates not set'}</div>
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
                  {!booking.agreementSignedAt && booking.status !== 'rejected' && (
                    <div className="card-meta" style={{ color: 'var(--amber)' }}>
                      booth agreement unsigned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-card">
        <h2 className="show-detail-title">Reserve booth space</h2>
        <p className="show-detail-meta">
          Published shows with space still available, across every organizer.
        </p>

        {bookable.length === 0 ? (
          <EmptyPanel
            title="Nothing available"
            note="No published show currently has vendor space on sale."
          />
        ) : (
          bookable.map((show) => (
            <div key={show.showId} className="discover-card">
              <div className="discover-top">
                <div>
                  <div className="discover-name">{show.showName}</div>
                  <div className="discover-meta">
                    {show.orgName}
                    {show.showDate && ` · ${show.showDate}`}
                  </div>
                </div>
              </div>
              <div className="space-grid">
                {show.items.map((item) => (
                  <div key={item.id} className="space-opt">
                    <div className="sname">{item.name}</div>
                    <div className="sprice">{formatMoney(item.price)}</div>
                    <div className="savail">
                      {item.remaining === null ? 'Unlimited' : `${String(item.remaining)} left`}
                    </div>
                    {/*
                      Reserving requires a payment method, and Stripe is not
                      configured — so this states the blocker rather than
                      appearing to work and failing at the last step.
                    */}
                    <button
                      type="button"
                      disabled
                      title="Reserving needs Stripe configured to take payment"
                      className="btn btn-ghost btn-sm"
                      style={{ opacity: 0.45 }}
                    >
                      Reserve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
