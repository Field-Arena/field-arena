import { formatMoney } from '@/shared/lib/format/currency';

export interface BookingSummaryStat {
  label: string;
  value: string | number;
  revenue?: boolean;
}

/** The three KPI tiles on a vendor's My Bookings page. */
export function summarizeBookings(
  bookings: { status: string; amountTotal: number | null }[],
): BookingSummaryStat[] {
  const paid = bookings.filter((b) => b.status === 'paid').length;
  const spend = bookings.reduce((sum, b) => sum + (b.amountTotal ?? 0), 0);
  return [
    { label: 'Bookings', value: bookings.length },
    { label: 'Paid', value: paid },
    { label: 'Total booked', value: formatMoney(spend), revenue: true },
  ];
}
