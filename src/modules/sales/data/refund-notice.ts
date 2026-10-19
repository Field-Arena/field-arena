import 'server-only';
import { sendEmail } from '@/shared/lib/email';
import { renderEmail } from '@/shared/lib/email-layout';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { createAdminClient } from '@/shared/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

interface RefundNotice {
  saleType: 'order' | 'vendor_booking';
  saleId: string;
  showId: string;
  amount: number;
}

/* Tells the rider (order) or vendor (booking) that money is on its way back.
 * Runs after Stripe has accepted the refund, so it never throws: a missing
 * address or a failed send is logged and the refund stands either way. */
export async function sendRefundNotice(admin: AdminClient, notice: RefundNotice): Promise<void> {
  try {
    const [recipient, { data: show }] = await Promise.all([
      refundRecipient(admin, notice),
      admin.from('shows').select('name').eq('id', notice.showId).maybeSingle(),
    ]);
    if (!recipient) {
      console.error('[sales] refund notice skipped: no email on file', notice.saleId);
      return;
    }

    const showName = show?.name ?? 'your show';
    const amount = formatMoneyExact(notice.amount);
    const { html, text } = renderEmail({
      preheader: `${amount} is being refunded for ${showName}.`,
      eyebrow: 'Refund issued',
      heading: 'Your refund is on its way',
      greeting: `Hi ${recipient.name || 'there'},`,
      paragraphs: [
        ['The organizer of ', { strong: showName }, ' has refunded ', { strong: amount }, '.'],
        'It goes back to the card or account you paid with. Banks usually take 5–10 business days to show it.',
      ],
      details: [
        { label: 'Show', value: showName },
        { label: 'Refunded', value: amount },
      ],
      closing: ['Questions about this refund? Reply to the show organizer directly.'],
      footerNote: `you paid for ${showName} on Field & Arena.`,
    });
    const sent = await sendEmail({
      to: recipient.email,
      subject: `Refund issued — ${showName}`,
      html,
      text,
    });
    if (!sent) console.error('[sales] refund notice was not delivered', notice.saleId);
  } catch (cause) {
    console.error('[sales] refund notice failed', notice.saleId, cause);
  }
}

async function refundRecipient(
  admin: AdminClient,
  notice: RefundNotice,
): Promise<{ email: string; name: string } | null> {
  if (notice.saleType === 'vendor_booking') {
    const { data } = await admin
      .from('vendor_bookings')
      .select('contact, contact_name, name')
      .eq('id', notice.saleId)
      .maybeSingle();
    if (!data?.contact) return null;
    return { email: data.contact, name: data.contact_name ?? data.name };
  }

  const { data: order } = await admin
    .from('orders')
    .select('rider_id')
    .eq('id', notice.saleId)
    .maybeSingle();
  if (!order) return null;
  const { data: rider } = await admin
    .from('riders')
    .select('email, first_name')
    .eq('id', order.rider_id)
    .maybeSingle();
  if (!rider?.email) return null;
  return { email: rider.email, name: rider.first_name ?? '' };
}
