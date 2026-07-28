import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';

/**
 * Vendor reads, ported from vendor.html: "My Bookings" and "Reserve booth space".
 *
 * A vendor's identity is platform-wide, not tied to one organizer — the legacy
 * view's own hint said so. Bookings are matched by contact email across every
 * show rather than through an org membership, because a vendor trades with
 * several organizers and has no account with any of them.
 */

export interface VendorBookingRow {
  id: string;
  showId: string;
  showName: string;
  showDate: string | null;
  status: string;
  amountTotal: number | null;
  paidAt: string | null;
  agreementSignedAt: string | null;
  items: { name: string; qty: number; price: number }[];
}

export async function listMyBookings(): Promise<VendorBookingRow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  const { data: bookings, error } = await supabase
    .from('vendor_bookings')
    .select('id, show_id, status, amount_total, paid_at, agreement_signed_at, contact, name')
    .or(`contact.eq.${profile.email},name.eq.${profile.name}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (bookings.length === 0) return [];

  const showIds = [...new Set(bookings.map((b) => b.show_id))];

  const [shows, lineItems] = await Promise.all([
    supabase.from('shows').select('id, name, date_label').in('id', showIds),
    supabase
      .from('vendor_booking_items')
      .select('booking_id, qty, vendor_items(name, price)')
      .in(
        'booking_id',
        bookings.map((b) => b.id)
      ),
  ]);
  if (shows.error) throw shows.error;
  if (lineItems.error) throw lineItems.error;

  const showById = new Map(shows.data.map((s) => [s.id, s]));

  const itemsByBooking = new Map<string, { name: string; qty: number; price: number }[]>();
  for (const row of lineItems.data) {
    const item = (row as unknown as { vendor_items: { name: string; price: number } | null })
      .vendor_items;
    if (!item) continue;
    const list = itemsByBooking.get(row.booking_id) ?? [];
    list.push({ name: item.name, qty: row.qty ?? 1, price: item.price });
    itemsByBooking.set(row.booking_id, list);
  }

  return bookings.map((b) => {
    const show = showById.get(b.show_id);
    return {
      id: b.id,
      showId: b.show_id,
      showName: show?.name ?? 'Unknown show',
      showDate: show?.date_label ?? null,
      status: b.status ?? 'pending',
      amountTotal: b.amount_total,
      paidAt: b.paid_at,
      agreementSignedAt: b.agreement_signed_at,
      items: itemsByBooking.get(b.id) ?? [],
    };
  });
}

export interface BookableShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  items: { id: string; name: string; price: number; qty: number | null; remaining: number | null }[];
}

/**
 * Shows with booth space still on sale — the legacy "discover" panel.
 *
 * Remaining stock is computed by subtracting booked quantities from each item's
 * cap, so a sold-out booth is not offered. A null cap means unlimited, which is
 * the schema's own convention rather than a missing value.
 */
export async function listBookableShows(): Promise<BookableShow[]> {
  const supabase = await createServerClient();

  const { data: items, error } = await supabase
    .from('vendor_items')
    .select('id, show_id, name, price, qty, enabled')
    .eq('enabled', true);
  if (error) throw error;
  if (items.length === 0) return [];

  const showIds = [...new Set(items.map((i) => i.show_id))];

  const [shows, booked] = await Promise.all([
    // Only published shows: an unpublished show is not open for business.
    supabase.from('shows').select('id, name, date_label, org_id').in('id', showIds).eq('published', true),
    supabase
      .from('vendor_booking_items')
      .select('vendor_item_id, qty')
      .in(
        'vendor_item_id',
        items.map((i) => i.id)
      ),
  ]);
  if (shows.error) throw shows.error;
  if (booked.error) throw booked.error;

  const orgIds = [...new Set(shows.data.map((s) => s.org_id))];
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);
  if (orgError) throw orgError;

  const orgById = new Map(orgs.map((o) => [o.id, o.name]));

  const bookedByItem = new Map<string, number>();
  for (const row of booked.data) {
    bookedByItem.set(row.vendor_item_id, (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1));
  }

  return shows.data
    .map((show) => ({
      showId: show.id,
      showName: show.name,
      showDate: show.date_label,
      orgName: orgById.get(show.org_id) ?? 'Unknown organizer',
      items: items
        .filter((i) => i.show_id === show.id)
        .map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price ?? 0,
          qty: i.qty,
          remaining: i.qty === null ? null : Math.max(0, i.qty - (bookedByItem.get(i.id) ?? 0)),
        }))
        .filter((i) => i.remaining === null || i.remaining > 0),
    }))
    .filter((show) => show.items.length > 0)
    .sort((a, b) => a.showName.localeCompare(b.showName));
}
