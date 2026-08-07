-- ShowStaff "Show Operations" port review found two RLS/storage gaps against
-- the legacy behaviour it was meant to mirror (api/shows/[id]/[resource].js).
--
-- 1. Documents: legacy explicitly carves out `POST resource === 'documents'`
--    for `showRole === 'ShowStaff'` (resource.js:272-276) even though
--    ShowStaff's ROLE_DEFAULTS is `{}` — no canEditShow (permissions.js:51).
--    `documents_write`/`fa_documents_write` both gate on canEditShow only,
--    so `uploadShowDocument` (modules/operations/data/mutations.ts), which
--    already assumed this carve-out existed, was RLS-denied for the one role
--    it was written for.
--
-- 2. Vendors: legacy 403s the entire GET /vendors resource for any caller
--    without `canViewMoney` (resource.js:363-370), regardless of role.
--    `vendor_bookings_select`/`vendor_booking_items_select` only required
--    `can_view_show`, which every staff role satisfies — so vendor contact
--    data (name/contact/contactName/phone) was reachable by any staff role
--    regardless of money visibility.

-- ---------------------------------------------------------------------------
-- 1. Documents — ShowStaff may INSERT (upload), matching legacy's POST carve-out
-- ---------------------------------------------------------------------------
create policy documents_insert_showstaff on public.documents
  for insert
  with check (public.has_staff_assignment(show_id, array['ShowStaff']));

drop policy if exists "fa_documents_write" on storage.objects;
create policy "fa_documents_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  )
  with check (
    bucket_id = 'documents'
    and (
      public.has_show_permission(public.storage_show_id(name), 'canEditShow')
      or public.has_staff_assignment(public.storage_show_id(name), array['ShowStaff'])
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Vendor bookings — read requires canViewMoney, matching legacy's GET gate
-- ---------------------------------------------------------------------------
drop policy if exists vendor_bookings_select on public.vendor_bookings;
create policy vendor_bookings_select on public.vendor_bookings
  for select using (public.has_show_permission(show_id, 'canViewMoney'));

drop policy if exists vendor_booking_items_select on public.vendor_booking_items;
create policy vendor_booking_items_select on public.vendor_booking_items
  for select using (
    exists (
      select 1 from public.vendor_bookings b
      where b.id = vendor_booking_items.booking_id
        and public.has_show_permission(b.show_id, 'canViewMoney')
    )
  );

-- Note: `vendor_bookings_select_own` / `vendor_booking_items_select_own`
-- (20260806140000_vendor_self_service.sql) are separate, additive policies
-- that let a Vendor-role caller see their own booking regardless of
-- canViewMoney — untouched by the drop/recreate above, which only targets
-- the staff-visibility policy.
