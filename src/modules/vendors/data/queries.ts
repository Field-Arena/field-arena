import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import type { PublicVendorApplyShow } from '../types';

/**
 * Vendor reads, ported from vendor.html: "My Bookings" and "Reserve booth space".
 *
 * A vendor's identity is platform-wide, not tied to one organizer — the legacy
 * view's own hint said so. Bookings are matched by contact email across every
 * show rather than through an org membership, because a vendor trades with
 * several organizers and has no account with any of them.
 */

export interface VendorDocumentRequirement {
  id: string;
  label: string;
}

export interface VendorDocumentUpload {
  requirementId: string;
  label: string;
  path: string;
  expirationDate: string | null;
  verified: boolean;
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
  /** Snapshot of what was actually signed — see vendor_bookings.agreement_signed_text's own doc comment. Null until signed. */
  agreementSignedText: string | null;
  /** The show's current agreement text, offered for signing when agreementSignedAt is null. */
  vendorAgreementText: string | null;
  items: { name: string; qty: number; price: number }[];
  vendorDocumentRequirements: VendorDocumentRequirement[];
  documentUploads: VendorDocumentUpload[];
}

/**
 * A vendor's own bookings, across every organizer — ported from vendor.html's
 * "My Bookings" (and reused by the Documents/History pages, which just filter
 * this same list rather than re-querying).
 *
 * Matched by contact email, same as legacy's real backend (GET
 * /api/organizations/:id/vendor-bookings?email=) — the `name` fallback below
 * is broader than legacy ever was, kept only because it was already here
 * before this port; supabase/migrations/20260806140000_vendor_self_service.sql's
 * RLS only ever admits a contact-email match, so a name-only match returns no
 * rows regardless.
 */
export async function listMyBookings(): Promise<VendorBookingRow[]> {
  const profile = await getStaffProfile();
  if (!profile) return [];

  const supabase = await createServerClient();

  const { data: bookings, error } = await supabase
    .from('vendor_bookings')
    .select(
      'id, show_id, status, amount_total, paid_at, agreement_signed_at, agreement_signed_text, document_uploads, contact, name'
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
        bookings.map((b) => b.id)
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

export interface BookableShow {
  showId: string;
  showName: string;
  showDate: string | null;
  orgName: string;
  items: { id: string; name: string; price: number; qty: number | null; remaining: number | null }[];
}

/**
 * Shows with booth space still on sale — the legacy "discover" panel, ported
 * from the real GET /api/shows?discover=vendor (handleDiscoverVendorShows):
 * every published, non-demo, non-suspended, not-yet-started show that has at
 * least one real enabled vendor_items row.
 *
 * Remaining stock is computed by subtracting booked quantities from each item's
 * cap, so a sold-out booth is not offered. A null cap means unlimited, which is
 * the schema's own convention rather than a missing value.
 *
 * "Apply" writes a real pending vendor_bookings row (applyToVendorShow in
 * ../data/mutations.ts) — the same real, non-money write vendor-apply.html's
 * POST made. Once an organizer approves the application, paying the booth
 * fee is a real Stripe Checkout Session (createVendorCheckoutSession in
 * ../data/mutations.ts, offered from the My Bookings page), reusing the same
 * hosted-Checkout pattern and admin-client fulfillment shape the Rider
 * Portal's own checkout established (see ../data/checkout.ts).
 */
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
    // Only published shows: an unpublished show is not open for business.
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
        items.map((i) => i.id)
      ),
  ]);
  if (shows.error) throw shows.error;
  if (booked.error) throw booked.error;

  // Not yet started, and not one of the seeded demo/suspended organizations —
  // the same "safe to show a real applicant" gate handleVendorApply and
  // handleDiscoverVendorShows both apply on the legacy side.
  const upcomingShows = shows.data.filter((s) => !s.start_date || s.start_date >= today);
  const orgIds = [...new Set(upcomingShows.map((s) => s.org_id))];
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, suspended, is_demo')
    .in('id', orgIds);
  if (orgError) throw orgError;

  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const visibleShows = upcomingShows.filter((s) => {
    const org = orgById.get(s.org_id);
    return org && !org.suspended && !org.is_demo;
  });

  const bookedByItem = new Map<string, number>();
  for (const row of booked.data) {
    bookedByItem.set(row.vendor_item_id, (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1));
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

/**
 * One show's vendor-apply catalog for a completely anonymous visitor — the
 * GET half of legacy's handleVendorApply (api/shows/[id]/[resource].js),
 * ported for app/vendor-apply/[showId]/page.tsx. No requireVendorProfile
 * here on purpose: this is the entry point BEFORE an account exists (see
 * data/mutations.ts's signUpVendor) — createServerClient() still works with
 * no session at all, and shows_select_published/vendor_items_select
 * (20260727120900_rls.sql) already admit any caller for a published,
 * non-demo, non-suspended show, the same public-safety gate
 * handleVendorApply applied.
 *
 * Returns null for anything not safe to show a real applicant — unpublished,
 * suspended, demo, or nonexistent — same 404-style response legacy gave
 * rather than leaking which of those it was.
 */
export async function getPublicVendorApplyShow(showId: string): Promise<PublicVendorApplyShow | null> {
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
  // organizations_select_public_show_owner (20260807000000) admits this read
  // exactly when the show above is published/non-demo/non-suspended — org
  // being null here would mean that policy disagrees with the show query
  // above, which should not happen, but org.suspended/is_demo are re-checked
  // anyway rather than trusted implicitly.
  if (!org || org.suspended || org.is_demo) return null;

  const { data: items, error: itemsError } = await supabase
    .from('vendor_items')
    .select('id, name, price, qty')
    .eq('show_id', showId)
    .eq('enabled', true);
  if (itemsError) throw itemsError;
  // No early return for an empty/sold-out catalog — legacy's own GET half of
  // handleVendorApply always returns the show with whatever items list it
  // has, even []. A vendor should still see the organizer's real "not open
  // for booth applications right now" state instead of an unexplained 404 —
  // the page itself renders that message when items is empty. Null here is
  // reserved for "this show isn't real/isn't safe to show," not "nothing to
  // sell yet."

  const { data: booked, error: bookedError } = await supabase
    .from('vendor_booking_items')
    .select('vendor_item_id, qty')
    .in(
      'vendor_item_id',
      items.map((i) => i.id)
    );
  if (bookedError) throw bookedError;

  const bookedByItem = new Map<string, number>();
  for (const row of booked) {
    bookedByItem.set(row.vendor_item_id, (bookedByItem.get(row.vendor_item_id) ?? 0) + (row.qty ?? 1));
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
