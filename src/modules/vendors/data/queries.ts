import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import type {
  BookableShow,
  PublicVendorApplyShow,
  VendorDocumentRequirement,
  VendorDocumentUpload,
} from '@/modules/vendors/types';

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

  const { data: bookings, error } = await supabase
    .from('vendor_bookings')
    .select(
      'id, show_id, status, amount_total, paid_at, agreement_signed_at, agreement_signed_text, document_uploads, contact, name',
    )
    .or(`contact.eq.${profile.email},name.eq.${profile.name}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
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
      .select('id, name, date_label, start_date, org_id')
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

  return visibleShows
    .map((show) => ({
      showId: show.id,
      showName: show.name,
      showDate: show.date_label,
      orgName: orgById.get(show.org_id)?.name ?? 'Unknown organizer',
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

export async function getPublicVendorApplyShow(
  showId: string,
): Promise<PublicVendorApplyShow | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, date_label, org_id')
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
