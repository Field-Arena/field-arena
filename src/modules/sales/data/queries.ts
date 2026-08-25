import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { SaleStatus, SaleType, SaleRow } from '@/modules/sales/types';

function deriveStatus(amountTotal: number, feeTotal: number, refundedAmount: number): SaleStatus {
  const refundableBase = amountTotal - feeTotal;
  if (refundedAmount <= 0) return 'paid';
  if (refundedAmount >= refundableBase) return 'refunded';
  return 'partial';
}

interface RawSale {
  id: string;
  amount_total: number | null;
  fee_total: number | null;
  refunded_amount: number | null;
  additional_charges_total: number | null;
  created_at: string;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
}

function toSaleRow(
  raw: RawSale,
  saleType: SaleRow['saleType'],
  type: SaleType,
  customer: string,
  showId: string,
  showName: string,
): SaleRow {
  const amountTotal = raw.amount_total ?? 0;
  const feeTotal = raw.fee_total ?? 0;
  const refundedAmount = raw.refunded_amount ?? 0;
  return {
    id: raw.id,
    saleType,
    type,
    customer,
    showId,
    showName,
    date: raw.paid_at ?? raw.created_at,
    amountTotal,
    feeTotal,
    refundedAmount,
    additionalChargesTotal: raw.additional_charges_total ?? 0,
    status: deriveStatus(amountTotal, feeTotal, refundedAmount),
    maxRefundable: Math.round(Math.max(0, amountTotal - feeTotal - refundedAmount) * 100) / 100,
    hasSavedCard: !!(raw.stripe_customer_id && raw.stripe_payment_method_id),
    stripePaymentIntentId: raw.stripe_payment_intent_id,
  };
}

export async function getCanRefund(
  showId: string,
  isOrganizerOrImpersonating: boolean,
): Promise<boolean> {
  if (isOrganizerOrImpersonating) return true;
  const supabase = await createServerClient();
  const { data } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canRefund',
  });
  return data === true;
}

export async function listSales(showId: string): Promise<SaleRow[]> {
  const supabase = await createServerClient();

  const [ordersRes, vendorRes, showRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, rider_id, amount_total, fee_total, refunded_amount, additional_charges_total, created_at, paid_at, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id',
      )
      .eq('show_id', showId)
      .eq('status', 'paid'),
    supabase
      .from('vendor_bookings')
      .select(
        'id, name, amount_total, fee_total, refunded_amount, additional_charges_total, created_at, paid_at, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id',
      )
      .eq('show_id', showId)
      .eq('status', 'paid'),
    supabase.from('shows').select('name').eq('id', showId).single(),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (vendorRes.error) throw vendorRes.error;
  if (showRes.error) throw showRes.error;

  const showName = showRes.data.name;

  const riderIds = [...new Set(ordersRes.data.map((o) => o.rider_id))];
  const riderNames = new Map<string, string>();
  if (riderIds.length > 0) {
    const { data: riders, error: riderError } = await supabase
      .from('riders')
      .select('id, first_name, last_name, email')
      .in('id', riderIds);
    if (riderError) throw riderError;
    for (const r of riders) {
      riderNames.set(r.id, [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email);
    }
  }

  const orderRows = ordersRes.data.map((o) =>
    toSaleRow(o, 'order', 'Rider', riderNames.get(o.rider_id) ?? 'Unknown rider', showId, showName),
  );

  const vendorRows = vendorRes.data.map((v) =>
    toSaleRow(v, 'vendor_booking', 'Vendor', v.name, showId, showName),
  );

  return [...orderRows, ...vendorRows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
