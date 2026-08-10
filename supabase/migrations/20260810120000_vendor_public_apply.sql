-- Vendor booth applications: open the door back up to a fully anonymous
-- applicant, matching legacy's vendor-apply.html exactly (a public POST with
-- no session at all — api/shows/[id]/[resource].js's handleVendorApply never
-- required an account).
--
-- 20260806140000_vendor_self_service.sql added vendor_bookings_insert_self /
-- vendor_booking_items_insert_self for a signed-in Vendor applying to another
-- show from their own dashboard — but that policy's WITH CHECK matches
-- `contact` against `auth.jwt() ->> 'email'`, which is empty for an
-- unauthenticated request, so it never actually admitted the public
-- /vendor-apply/[showId] entry point. This adds the missing sibling pair with
-- no identity check at all, same shape as `vendor_bookings_insert_self` minus
-- the JWT match — no `to` clause, same as every other policy in this schema
-- (shows_select_published, vendor_items_select), so it covers anon and
-- authenticated alike, exactly as open as legacy's endpoint was.
--
-- This is also the case vendor_bookings' own `contact` column was already
-- designed for (see that migration's header comment: "a booking can predate
-- the vendor ever signing in") — vendor_bookings_select_own/update_own
-- already match a later real account to this row by email once one exists.

create policy vendor_bookings_insert_anon on public.vendor_bookings
  for insert
  with check (
    status = 'pending'
    and contact is not null
    and exists (
      select 1
      from public.shows s
      join public.organizations o on o.id = s.org_id
      where s.id = show_id
        and s.published = true
        and o.suspended = false
        and o.is_demo = false
    )
  );

-- A plain `exists (select 1 from vendor_bookings ...)` subquery here doesn't
-- work for an anonymous caller the way it does for vendor_bookings_insert_anon
-- above: unlike that policy (which only reads shows/organizations, both
-- publicly readable — shows_select_published,
-- organizations_select_public_show_owner), this would need to read
-- vendor_bookings itself, and anon has no SELECT policy admitting a booking
-- it doesn't have a matching auth.jwt() email for (vendor_bookings_select_own)
-- — confirmed live: the plain-subquery version 42501'd even for the booking
-- this same request had just inserted. booking_show_id
-- (20260727121300_fix_rls_recursion.sql) already establishes the pattern for
-- exactly this problem — a SECURITY DEFINER helper that answers a narrow
-- question about a booking without requiring the caller to have SELECT on the
-- whole row.
create or replace function public.booking_is_pending(target_booking_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select status = 'pending' from public.vendor_bookings where id = target_booking_id;
$$;

-- Line items for a booking that is still open (pending) — same window
-- vendor_booking_items_insert_self uses, minus the contact-email match. A
-- stranger who guesses another applicant's pending booking id could add line
-- items to it with no further check, same weak model legacy's own anonymous
-- POST had (a single unauthenticated request, no ownership proof at all).
create policy vendor_booking_items_insert_anon on public.vendor_booking_items
  for insert
  with check (coalesce(public.booking_is_pending(booking_id), false));
