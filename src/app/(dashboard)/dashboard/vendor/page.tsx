import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyBookings } from '@/modules/vendors/data/queries';
import { confirmVendorCheckoutSession } from '@/modules/vendors/data/mutations';
import { formatMoney } from '@/shared/lib/format/currency';
import { VendorAgreementDialog } from '@/modules/vendors/ui/vendor-agreement-dialog';
import { VendorPayButton } from '@/modules/vendors/ui/vendor-pay-button';
import { VendorCheckoutConfirmation } from '@/modules/vendors/ui/vendor-checkout-confirmation';
import { previewAmountDue } from '@/modules/vendors/utils/preview-amount-due';
import { summarizeBookings } from '@/modules/vendors/utils/summarize-bookings';
import {
  CardTitle,
  EmptyState,
  FA_BTN_PRIMARY,
  FA_MUTED,
  FaCard,
  PageHeader,
  Pill,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'My Bookings — Field & Arena' };

const EYEBROW = 'Your booth space across every organizer on the platform';

function paidOn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; checkoutSession?: string; checkoutCanceled?: string }>;
}) {
  const {
    booking: confirmBookingId,
    checkoutSession: checkoutSessionId,
    checkoutCanceled,
  } = await searchParams;

  if (confirmBookingId && checkoutSessionId) {
    const result = await confirmVendorCheckoutSession({
      bookingId: confirmBookingId,
      sessionId: checkoutSessionId,
    });
    return (
      <div className="text-ink-deep font-[family-name:var(--font-ar)]">
        <PageHeader eyebrow={EYEBROW} title="My Bookings" />
        <VendorCheckoutConfirmation result={result} />
      </div>
    );
  }

  const bookings = await listMyBookings();

  const stats = summarizeBookings(bookings);

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow={EYEBROW}
        title="My Bookings"
        actions={
          <Link href="/dashboard/vendor/discover" prefetch={false} className={FA_BTN_PRIMARY}>
            + Reserve space
          </Link>
        }
      />

      {checkoutCanceled === '1' && (
        <FaCard tone="warn" className="mb-4">
          <p className="text-[14px] font-semibold text-[#8A6D14]">
            Checkout was canceled — nothing was charged.
          </p>
        </FaCard>
      )}

      <StatGrid cols={3}>
        {stats.map((stat) => (
          <StatBox
            key={stat.label}
            label={stat.label}
            value={stat.value}
            tone={stat.label === 'Paid' ? 'green' : 'default'}
          />
        ))}
      </StatGrid>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          note="Reserve booth space from Reserve Space, or apply directly through an organizer's vendor application."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <FaCard
              key={booking.id}
              tone={booking.status === 'approved' ? 'warn' : 'default'}
              className="flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>{booking.showName}</CardTitle>
                  <p className={FA_MUTED}>
                    {booking.orgName} · {booking.showDate ?? 'Dates not set'}
                  </p>
                </div>
                {booking.status === 'paid' ? (
                  <Pill tone="green">Paid{booking.paidAt ? ` ${paidOn(booking.paidAt)}` : ''}</Pill>
                ) : booking.status === 'approved' ? (
                  <Pill tone="yellow" className="whitespace-normal">
                    Approved — awaiting payment
                  </Pill>
                ) : booking.status === 'rejected' ? (
                  <Pill tone="red">Rejected</Pill>
                ) : booking.status === 'review' ? (
                  <Pill tone="yellow" className="whitespace-normal">
                    Payment under review
                  </Pill>
                ) : (
                  <Pill tone="grey">Pending review</Pill>
                )}
              </div>

              {booking.items.length > 0 && (
                <ul className="my-3 list-none p-0 text-[14px] leading-[1.8]">
                  {booking.items.map((item) => (
                    <li key={item.name}>
                      {item.name} × {String(item.qty)} · {formatMoney(item.price * item.qty)}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF0EE] pt-3">
                <b className="text-[20px] text-[#0D2C23]">
                  {booking.amountTotal !== null ? formatMoney(booking.amountTotal) : ''}
                </b>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {booking.status !== 'rejected' &&
                    (booking.agreementSignedAt ? (
                      <span className={FA_MUTED}>Agreement signed</span>
                    ) : (
                      <VendorAgreementDialog
                        bookingId={booking.id}
                        showName={booking.showName}
                        agreementText={booking.vendorAgreementText}
                      />
                    ))}

                  {/* Legacy offered "Pay now" on any unpaid booking, not only
                   * an approved one (vendor.html:242) — a vendor could pay the
                   * moment they applied. */}
                  {/* A booking in 'review' already has a payment the organizer
                   * is reconciling, so it is never offered for payment again. */}
                  {booking.status !== 'paid' &&
                    booking.status !== 'rejected' &&
                    booking.status !== 'review' &&
                    booking.agreementSignedAt && (
                      <VendorPayButton
                        bookingId={booking.id}
                        amountDue={previewAmountDue(booking.items)}
                      />
                    )}
                </div>
              </div>

              {booking.status !== 'paid' &&
                booking.status !== 'rejected' &&
                booking.status !== 'review' &&
                !booking.agreementSignedAt && (
                  <p className="mt-2 text-right text-[12.5px] font-semibold text-[#8A6D14]">
                    Sign the booth agreement to pay
                  </p>
                )}
            </FaCard>
          ))}
        </div>
      )}
    </div>
  );
}
