import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { formatMoney } from '@/shared/lib/format/currency';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  PageHeader,
} from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function VendorHistoryPage() {
  const bookings = await listMyBookings();
  const past = bookings
    .filter((b) => b.status === 'paid' && b.showIsPast)
    .sort((a, b) => (b.showLastDay ?? '').localeCompare(a.showLastDay ?? ''));

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader eyebrow="Shows you've vended at" title="History" />

      {past.length === 0 ? (
        <EmptyState
          title="No completed shows yet"
          note="Paid bookings appear here once their show has passed."
        />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Date
                </th>
                <th scope="col" className={FA_TH}>
                  Show
                </th>
                <th scope="col" className={FA_TH}>
                  Organizer
                </th>
                <th scope="col" className={`${FA_TH} text-right`}>
                  Total paid
                </th>
              </tr>
            </thead>
            <tbody>
              {past.map((booking) => (
                <tr key={booking.id} className={FA_TR}>
                  <td className={`${FA_TD} text-[#5A6B63]`}>{booking.showDate ?? ''}</td>
                  <td className={`${FA_TD} font-bold text-[#0D2C23]`}>{booking.showName}</td>
                  <td className={FA_TD}>{booking.orgName}</td>
                  <td className={`${FA_TD} text-right font-bold`}>
                    {formatMoney(booking.amountTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
