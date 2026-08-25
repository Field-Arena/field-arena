import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { formatMoney } from '@/shared/lib/format/currency';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function VendorHistoryPage() {
  const bookings = await listMyBookings();
  const today = new Date().toISOString().slice(0, 10);
  const past = bookings
    .filter((b) => b.status === 'paid' && (!b.showDate || b.showDate < today))
    .sort((a, b) => (b.showDate ?? '').localeCompare(a.showDate ?? ''));

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>History</h1>
          <p>Shows you&apos;ve vended at.</p>
        </div>
      </div>

      <div className="dash-card">
        {past.length === 0 ? (
          <EmptyPanel
            title="No completed shows yet"
            note="Paid bookings appear here once their show has passed."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Show</th>
                <th scope="col">Organizer</th>
                <th scope="col" className="r">
                  Total paid
                </th>
              </tr>
            </thead>
            <tbody>
              {past.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.showDate ?? ''}</td>
                  <td>{booking.showName}</td>
                  <td>{booking.orgName}</td>
                  <td className="r">{formatMoney(booking.amountTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
