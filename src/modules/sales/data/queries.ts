import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import type {
  SaleStatus,
  SaleType,
  SaleRow,
  SaleLineItem,
  SaleLineItemGroup,
} from '@/modules/sales/types';

/* Mirrors riders/constants.ts's ORDER_LINE_ITEM_KINDS ('class_entry' |
 * 'qualification' | 'addon') by hand rather than importing it — a module
 * must not import another module's internals, and this is the one place
 * sales needs to turn that kind into a report-facing group label. */
function groupForOrderItemKind(kind: unknown): SaleLineItemGroup {
  if (kind === 'class_entry') return 'Entry fees';
  if (kind === 'qualification') return 'Qualifications';
  return 'Add-ons';
}

/* orders.items is jsonb, written by the riders module as its own
 * OrderLineItem shape (kind, label, qty, unitPrice, amount, ...). Sales only
 * needs label/qty/unitPrice/amount for the invoice view, and a module must
 * not import another module's internal types, so this reads the same column
 * through its own narrow local shape instead. */
function parseOrderItems(raw: unknown): SaleLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : 'Item',
      qty: typeof item.qty === 'number' ? item.qty : 1,
      unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
      amount: typeof item.amount === 'number' ? item.amount : 0,
      group: groupForOrderItemKind(item.kind),
    }));
}

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
  items: SaleLineItem[],
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
    items,
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
  // stripe_customer_id / stripe_payment_method_id are not SELECT-able by the
  // `authenticated` role (20260907120000_fix_money_column_privileges.sql).
  // The Event Sales screen is reached only through getOrganizerContext, which
  // has already scoped this show to the caller's organization.
  const admin = createAdminClient();

  const [ordersRes, vendorRes, showRes] = await Promise.all([
    admin
      .from('orders')
      .select(
        'id, rider_id, amount_total, fee_total, refunded_amount, additional_charges_total, created_at, paid_at, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id, items',
      )
      .eq('show_id', showId)
      .eq('status', 'paid'),
    admin
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
    toSaleRow(
      o,
      'order',
      'Rider',
      riderNames.get(o.rider_id) ?? 'Unknown rider',
      showId,
      showName,
      parseOrderItems(o.items),
    ),
  );

  const vendorBookingIds = vendorRes.data.map((v) => v.id);
  const vendorItemsByBooking = new Map<string, SaleLineItem[]>();
  if (vendorBookingIds.length > 0) {
    const { data: bookingItems, error: bookingItemsError } = await admin
      .from('vendor_booking_items')
      .select('booking_id, qty, vendor_items(name, price)')
      .in('booking_id', vendorBookingIds);
    if (bookingItemsError) throw bookingItemsError;
    for (const row of bookingItems) {
      const list = vendorItemsByBooking.get(row.booking_id) ?? [];
      const unitPrice = row.vendor_items.price ?? 0;
      list.push({
        label: row.vendor_items.name,
        qty: row.qty ?? 1,
        unitPrice,
        amount: Math.round(unitPrice * (row.qty ?? 1) * 100) / 100,
        group: 'Vendor items',
      });
      vendorItemsByBooking.set(row.booking_id, list);
    }
  }

  const vendorRows = vendorRes.data.map((v) =>
    toSaleRow(
      v,
      'vendor_booking',
      'Vendor',
      v.name,
      showId,
      showName,
      vendorItemsByBooking.get(v.id) ?? [],
    ),
  );

  return [...orderRows, ...vendorRows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
