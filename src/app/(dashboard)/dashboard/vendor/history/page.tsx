import type { Metadata } from 'next';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { formatMoney } from '@/shared/lib/format/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Date</TableHead>
                <TableHead scope="col">Show</TableHead>
                <TableHead scope="col">Organizer</TableHead>
                <TableHead scope="col" className="text-right">
                  Total paid
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.showDate ?? ''}</TableCell>
                  <TableCell>{booking.showName}</TableCell>
                  <TableCell>{booking.orgName}</TableCell>
                  <TableCell className="text-right">{formatMoney(booking.amountTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
