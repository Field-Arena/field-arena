import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import {
  VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS,
  VENDOR_MAPS_BUCKET,
} from '@/modules/vendors/constants';
import type {
  BookableShow,
  PublicVendorApplyShow,
  VendorDocumentRequirement,
  VendorDocumentUpload,
} from '@/modules/vendors/types';

/* Legacy served the booth map as a PUBLIC blob (uploadPublicBlob →
 * 'show-images/<showId>/vendormap') and linked it straight off the apply page,
 * so anyone holding the link could open it forever. FA keeps vendor maps in a
 * private bucket whose read policy is `authenticated` + can_view_show — which
 * no vendor satisfies, so the file the organizer uploads was reaching nobody.
 *
 * Signed here with the admin client, and only for a show that has already
 * passed the public-apply gate (published, org not suspended, not demo). A
 * one-hour signed URL is strictly narrower than legacy's permanent public one
 * while restoring the thing a vendor actually needs: seeing where the booths
 * are before choosing one. */
async function resolveVendorMapUrl(
  vendorMapPath: string | null,
  vendorMapUrl: string | null,
): Promise<string | null> {
  if (vendorMapPath) {
    const { data } = await createAdminClient()
      .storage.from(VENDOR_MAPS_BUCKET)
      .createSignedUrl(vendorMapPath, VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }
  return vendorMapUrl;
}

export interface VendorBookingRow {
  id: string;
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  status: string;
  amountTotal: number | null;
  paidAt: string | null;
  agreementSignedAt: string | null;

  agreementSignedText: string | null;

  vendorAgreementText: string | null;
  items: { name: string; qty: number; price: number }[];
  vendorDocumentRequirements: VendorDocumentRequirement[];
  documentUploads: VendorDocumentUpload[];
}

export async function listMyBookings(): Promise<VendorBookingRow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  /* Ownership is the contact email and nothing else. Matching on `name` too
   * treated the booking's BUSINESS name as an identity — a different person
   * trading under the same business name would have matched. RLS
   * (vendor_bookings_select_own) always blocked the read, so nothing ever
   * leaked, but the clause was also a real availability bug: `.or()` takes a
   * PostgREST filter string, so a profile name containing a comma or a
   * parenthesis was parsed as extra conditions and errored the whole
   * dashboard.
   *
   * Filtered in TS rather than as a query filter so it matches RLS's
   * `lower(contact) = lower(jwt email)` exactly — a `.eq` would be
   * case-sensitive and could return fewer rows than the policy permits. */
  const { data: allBookings, error } = await supabase
    .from('vendor_bookings')
    .select(
      'id, show_id, status, amount_total, paid_at, agreement_signed_at, agreement_signed_text, document_uploads, contact, name',
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  const vendorEmail = profile.email.toLowerCase();
  const bookings = allBookings.filter((b) => (b.contact ?? '').toLowerCase() === vendorEmail);
  if (bookings.length === 0) return [];

  const showIds = [...new Set(bookings.map((b) => b.show_id))];

  const [shows, lineItems] = await Promise.all([
    supabase
      .from('shows')
      .select('id, name, date_label, org_id, vendor_document_requirements, vendor_agreement_text')
      .in('id', showIds),
    supabase
      .from('vendor_booking_items')
      .select('booking_id, qty, vendor_items(name, price)')
      .in(
        'booking_id',
        bookings.map((b) => b.id),
      ),
  ]);
  if (shows.error) throw shows.error;
  if (lineItems.error) throw lineItems.error;

  const orgIds = [...new Set(shows.data.map((s) => s.org_id))];
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);
  if (orgError) throw orgError;
  const orgById = new Map(orgs.map((o) => [o.id, o.name]));

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
    const requirements = Array.isArray(show?.vendor_document_requirements)
      ? (show.vendor_document_requirements as unknown as VendorDocumentRequirement[])
      : [];
    const uploads = Array.isArray(b.document_uploads)
      ? (b.document_uploads as unknown as VendorDocumentUpload[])
      : [];
    return {
      id: b.id,
      showId: b.show_id,
      showName: show?.name ?? 'Unknown show',
      showDate: show?.date_label ?? null,
      orgName: show ? (orgById.get(show.org_id) ?? 'Unknown organizer') : 'Unknown organizer',
      status: b.status ?? 'pending',
      amountTotal: b.amount_total,
      paidAt: b.paid_at,
      agreementSignedAt: b.agreement_signed_at,
      agreementSignedText: b.agreement_signed_text,
      vendorAgreementText: show?.vendor_agreement_text ?? null,
      items: itemsByBooking.get(b.id) ?? [],
      vendorDocumentRequirements: requirements,
      documentUploads: uploads,
    };
  });
}

export async function listBookableShows(): Promise<BookableShow[]> {
  const supabase = await createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: items, error } = await supabase
    .from('vendor_items')
    .select('id, show_id, name, price, qty, enabled')
    .eq('enabled', true);
  if (error) throw error;
  if (items.length === 0) return [];

  const showIds = [...new Set(items.map((i) => i.show_id))];

  const [shows, booked] = await Promise.all([
    supabase
      .from('shows')
      .select('id, name, date_label, start_date, org_id, vendor_map_path, vendor_map_url')
      .in('id', showIds)
      .eq('published', true),
    supabase
      .from('vendor_booking_items')
      .select('vendor_item_id, qty')
      .in(
        'vendor_item_id',
        items.map((i) => i.id),
      ),
  ]);
  if (shows.error) throw shows.error;
  if (booked.error) throw booked.error;

  const upcomingShows = shows.data.filter((s) => !s.start_date || s.start_date >= today);
  const orgIds = [...new Set(upcomingShows.map((s) => s.org_id))];
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, suspended')
    .in('id', orgIds);
  if (orgError) throw orgError;

  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const visibleShows = upcomingShows.filter((s) => {
    const org = orgById.get(s.org_id);
    return org && !org.suspended;
  });

  const bookedByItem = new Map<string, number>();
  for (const row of booked.data) {
    bookedByItem.set(
      row.vendor_item_id,
      (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1),
    );
  }

  return (
    await Promise.all(
      visibleShows.map(async (show) => ({
      showId: show.id,
      showName: show.name,
      showDate: show.date_label,
      orgName: orgById.get(show.org_id)?.name ?? 'Unknown organizer',
      vendorMapUrl: await resolveVendorMapUrl(show.vendor_map_path, show.vendor_map_url),
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
      })),
    )
  )
    .filter((show) => show.items.length > 0)
    .sort((a, b) => a.showName.localeCompare(b.showName));
}

export async function getPublicVendorApplyShow(
  showId: string,
): Promise<PublicVendorApplyShow | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label, org_id, vendor_map_path, vendor_map_url')
    .eq('id', showId)
    .eq('published', true)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, suspended, is_demo')
    .eq('id', show.org_id)
    .maybeSingle();
  if (orgError) throw orgError;

  if (!org || org.suspended || org.is_demo) return null;

  const { data: items, error: itemsError } = await supabase
    .from('vendor_items')
    .select('id, name, price, qty')
    .eq('show_id', showId)
    .eq('enabled', true);
  if (itemsError) throw itemsError;

  const { data: booked, error: bookedError } = await supabase
    .from('vendor_booking_items')
    .select('vendor_item_id, qty')
    .in(
      'vendor_item_id',
      items.map((i) => i.id),
    );
  if (bookedError) throw bookedError;

  const bookedByItem = new Map<string, number>();
  for (const row of booked) {
    bookedByItem.set(
      row.vendor_item_id,
      (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1),
    );
  }

  return {
    showId: show.id,
    showName: show.name,
    showDate: show.date_label,
    orgName: org.name,
    vendorMapUrl: await resolveVendorMapUrl(show.vendor_map_path, show.vendor_map_url),
    items: items
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price ?? 0,
        qty: i.qty,
        remaining: i.qty === null ? null : Math.max(0, i.qty - (bookedByItem.get(i.id) ?? 0)),
      }))
      .filter((i) => i.remaining === null || i.remaining > 0),
  };
}
