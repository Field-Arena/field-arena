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
import { redactSaleMoney } from '@/modules/sales/utils/redact-sale-money';
import { parseAdditionalCharges } from '@/modules/sales/utils/additional-charges';
import { additionalRefundedTotal } from '@/shared/lib/sales-math';

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

/* vendor_bookings.checkout_snapshot is written by the vendors module at
 * checkout ({items: [{label, qty, unitPrice, amount, ...}], ...}) — the
 * lines the vendor actually paid for. Read through a narrow local shape for
 * the same reason as parseOrderItems. Null when the booking predates the
 * snapshot, in which case the caller falls back to the live catalog. */
function parseVendorSnapshotItems(raw: unknown): SaleLineItem[] | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const items = (raw as Record<string, unknown>).items;
  if (!Array.isArray(items)) return null;
  return parseOrderItems(items).map((item) => ({ ...item, group: 'Vendor items' as const }));
}

/* Driven by the original payment. A refund of an additional charge alone
 * makes an otherwise untouched sale 'partial' — money did go back. */
function deriveStatus(
  amountTotal: number,
  feeTotal: number,
  refundedAmount: number,
  additionalRefunded: number,
): SaleStatus {
  const refundableBase = amountTotal - feeTotal;
  if (refundedAmount <= 0) return additionalRefunded > 0 ? 'partial' : 'paid';
  if (refundedAmount >= refundableBase) return 'refunded';
  return 'partial';
}

interface RawSale {
  id: string;
  amount_total: number | null;
  fee_total: number | null;
  refunded_amount: number | null;
  additional_charges_total: number | null;
  additional_charges: unknown;
  created_at: string;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  review_reason: string | null;
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
  const additionalCharges = parseAdditionalCharges(raw.additional_charges);
  const additionalRefunded = additionalRefundedTotal(raw.additional_charges);
  const maxRefundable =
    Math.round(Math.max(0, amountTotal - feeTotal - refundedAmount) * 100) / 100;
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
    additionalRefundedTotal: additionalRefunded,
    additionalCharges,
    status: deriveStatus(amountTotal, feeTotal, refundedAmount, additionalRefunded),
    maxRefundable,
    hasRefundableBalance: maxRefundable > 0 || additionalCharges.some((c) => c.maxRefundable > 0),
    hasSavedCard: !!(raw.stripe_customer_id && raw.stripe_payment_method_id),
    stripePaymentIntentId: raw.stripe_payment_intent_id,
    reviewReason: raw.review_reason,
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

async function hasShowPermission(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  showId: string,
  permissionKey: 'canViewMoney' | 'canRefund',
): Promise<boolean> {
  const { data } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: permissionKey,
  });
  return data === true;
}

/* `canViewMoney` / `canRefund` are what the page resolved for the caller
 * (they can only narrow — e.g. an Organizer previewing as Show Admin). The
 * money gate is re-checked here against has_show_permission (which already
 * covers Organizer, org owner and SuperAdmin), because the rows are read with
 * the service-role client and RLS cannot redact them on the way out. */
export async function listSales(
  showId: string,
  access: { canViewMoney: boolean; canRefund: boolean },
): Promise<SaleRow[]> {
  const supabase = await createServerClient();
  const [moneyAllowed, refundAllowed] = await Promise.all([
    access.canViewMoney ? hasShowPermission(supabase, showId, 'canViewMoney') : false,
    access.canRefund ? hasShowPermission(supabase, showId, 'canRefund') : false,
  ]);
  // stripe_customer_id / stripe_payment_method_id are not SELECT-able by the
  // `authenticated` role (20260907120000_fix_money_column_privileges.sql).
  // The Event Sales screen is reached only through getOrganizerContext, which
  // has already scoped this show to the caller's organization.
  const admin = createAdminClient();

  const [ordersRes, vendorRes, showRes] = await Promise.all([
    admin
      .from('orders')
      .select(
        'id, rider_id, amount_total, fee_total, refunded_amount, additional_charges_total, additional_charges, created_at, paid_at, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id, review_reason, items',
      )
      .eq('show_id', showId)
      .eq('status', 'paid'),
    admin
      .from('vendor_bookings')
      .select(
        'id, name, amount_total, fee_total, refunded_amount, additional_charges_total, additional_charges, created_at, paid_at, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id, review_reason, checkout_snapshot',
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

  // Invoice lines are what was paid (the checkout snapshot); only bookings
  // paid before snapshots existed are priced from today's catalog.
  const vendorBookingIds = vendorRes.data
    .filter((v) => parseVendorSnapshotItems(v.checkout_snapshot) === null)
    .map((v) => v.id);
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
      parseVendorSnapshotItems(v.checkout_snapshot) ?? vendorItemsByBooking.get(v.id) ?? [],
    ),
  );

  const rows = [...orderRows, ...vendorRows].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? ''),
  );
  return moneyAllowed ? rows : rows.map((row) => redactSaleMoney(row, refundAllowed));
}
