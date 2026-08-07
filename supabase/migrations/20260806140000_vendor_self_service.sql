-- Vendor self-service: lets a signed-in Vendor (public.users.platform_role =
-- 'Vendor') see and act on their own vendor_bookings row, without granting
-- them any staff-level access to a show's other data.
--
-- Before this migration, vendor_bookings/vendor_booking_items had exactly two
-- permissive policies: `_write` (staff with canManageVendors, for all) and
-- `_select` (public.can_view_show — staff/managers of that show). Neither
-- admits the vendor themself, so listMyBookings() in
-- src/modules/vendors/data/queries.ts — reading through the caller's own,
-- RLS-bound client, same as every other query in this codebase per
-- architecture.md — returned zero rows for a real Vendor account. This closes
-- that gap the same way public.riders' own data is scoped (horses_owner_all,
-- horse-documents' fa_horse_docs_owner): additional permissive policies keyed
-- to the caller's own identity, combined with the existing ones by OR.
--
-- A vendor booking has no user_id column (a booking can predate the vendor
-- ever signing in — see staff/data/mutations.ts's addStaffUser Vendor branch,
-- which inserts a vendor_bookings row from just an email, same as legacy).
-- Matching is therefore by contact email against the caller's own JWT email,
-- the exact idiom has_staff_assignment already uses for staff_assignments.email
-- above (line ~123 of the previous migration) — no new SECURITY DEFINER
-- lookup function needed.
--
-- Money-moving writes (status, amount_total, refunded_amount, the two Stripe
-- id columns) stay off-limits to the vendor themselves: `vendor_bookings_write`
-- is left untouched (staff-only), and the new self-serve UPDATE policy below
-- is paired with a column-level GRANT that only opens the agreement and
-- document-upload columns — a vendor cannot mark their own booking paid or
-- alter what was charged no matter what a client sends, same defense used for
-- stripe_customer_id/stripe_payment_method_id via the existing
-- `revoke select (...) from authenticated, anon` below.

-- ---------------------------------------------------------------------------
-- vendor_bookings — read/insert/update own row
-- ---------------------------------------------------------------------------
create policy vendor_bookings_select_own on public.vendor_bookings
  for select
  using (
    contact is not null
    and lower(contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- The real, non-money half of vendor-apply.html's public POST, ported for a
-- signed-in platform Vendor instead of an anonymous form: a booking can only
-- ever be *inserted* as 'pending' and against one's own email, and only for a
-- show actually open for business (published, not suspended/demo — the same
-- gate handleVendorApply applied). Approving/rejecting/marking paid remains
-- exclusively a staff action through vendor_bookings_write.
create policy vendor_bookings_insert_self on public.vendor_bookings
  for insert
  with check (
    status = 'pending'
    and contact is not null
    and lower(contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
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

create policy vendor_bookings_update_own on public.vendor_bookings
  for update
  using (
    contact is not null
    and lower(contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    contact is not null
    and lower(contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Column-scope what a plain authenticated caller may SET, so
-- vendor_bookings_update_own above can only ever be used to sign the booth
-- agreement or manage the vendor's own document uploads — never to touch
-- status, amount_total, refunded_amount, or either Stripe id column. Staff
-- writes (refundSale/chargeMore in sales/data/mutations.ts, and any future
-- approve/reject action) go through the service-role client, which bypasses
-- table grants entirely, so this does not affect them.
revoke update on public.vendor_bookings from authenticated;
grant update (
  agreement_signed_at, agreement_signed_text, agreement_signed_name, document_uploads
) on public.vendor_bookings to authenticated;

-- ---------------------------------------------------------------------------
-- vendor_booking_items — read/insert own booking's line items
-- ---------------------------------------------------------------------------
create policy vendor_booking_items_select_own on public.vendor_booking_items
  for select
  using (
    exists (
      select 1 from public.vendor_bookings b
      where b.id = booking_id
        and lower(b.contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Only into a booking that is still the vendor's own pending application —
-- once staff act on it (approved/rejected/paid), the cart is closed, same as
-- legacy's booking-time-only cart (vendor_booking_items is never edited after
-- creation, per that table's own comment in api/shows/[id]/[resource].js).
create policy vendor_booking_items_insert_self on public.vendor_booking_items
  for insert
  with check (
    exists (
      select 1 from public.vendor_bookings b
      where b.id = booking_id
        and b.status = 'pending'
        and lower(b.contact) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: a private bucket for the vendor's own booking documents
-- (certificates of insurance, etc.) — the Documents tab's real upload/view/
-- delete, ported from legacy's vendor-docs/ Blob prefix in
-- api/organizations/[id]/[resource].js's handleVendorDocument.
--
-- Path convention (see storage.sql's own header for the pattern this
-- extends): vendor-docs/{vendor_auth_uid}/{booking_id}/{filename}. The first
-- segment is the authorization key, exactly like horse-documents/{rider_id}/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vendor-docs', 'vendor-docs', false)
on conflict (id) do nothing;

create policy "fa_vendor_docs_owner" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'vendor-docs'
    and public.safe_uuid((storage.foldername(name))[1]) = auth.uid()
  )
  with check (
    bucket_id = 'vendor-docs'
    and public.safe_uuid((storage.foldername(name))[1]) = auth.uid()
  );

-- Staff on that booking's show may view (not write) the vendor's uploaded
-- documents while reviewing an application — mirrors fa_horse_docs_staff_read,
-- read-only for the same reason: staff editing a vendor's own uploaded file on
-- their behalf is not a real legacy behavior worth inventing here.
create policy "fa_vendor_docs_staff_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vendor-docs'
    and public.can_view_show(
      public.booking_show_id(public.safe_uuid((storage.foldername(name))[2]))
    )
  );
