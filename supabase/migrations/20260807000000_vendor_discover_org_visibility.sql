-- Fixes a real bug found while live-testing the vendor booth-payment flow
-- (see modules/vendors/data/queries.ts's listBookableShows and
-- listMyBookings): organizations_select
-- (supabase/migrations/20260727120900_rls.sql) only admits a caller who is
-- either SuperAdmin, that org's own Organizer, or staff with a
-- staff_assignments row for one of its shows. A platform-wide Vendor is none
-- of those — their identity has no org membership and no staff_assignments
-- row (see 20260806140000_vendor_self_service.sql's own header) — so every
-- organizations read a vendor's own client makes returns zero rows under
-- RLS, silently, with no error.
--
-- Concretely this broke two real reads, confirmed live against this
-- database with a real Vendor session:
--   - listBookableShows (Discover Shows / "Reserve Space" tab): joins
--     upcomingShows against organizations to filter out suspended/demo orgs
--     and to read orgName. With organizations returning nothing, every show
--     was filtered out — the tab always rendered "Nothing available",
--     regardless of real, published, bookable shows existing.
--   - listMyBookings (My Bookings / Documents / History tabs): reads
--     orgName the same way. A vendor's own bookings still appeared (those
--     come from vendor_bookings/shows, which already have vendor-visible
--     policies), but every one showed "Unknown organizer" instead of the
--     real organizer name.
--
-- The fix mirrors shows_select_published's own public-browse condition
-- exactly (same migration, same file): an org's basic identity is not
-- sensitive once it has at least one published, non-demo, non-suspended
-- show — that show is already publicly visible (to anyone, not just
-- vendors — shows_select_published has no role check either), so the org
-- that owns it cannot meaningfully stay hidden. Suspended/demo/deleted orgs
-- are still excluded, so a suspended org cannot be discovered through this
-- policy even if one of its shows is stale-published.
create policy organizations_select_public_show_owner on public.organizations
  for select
  using (
    suspended = false
    and deleted_at is null
    and is_demo = false
    and exists (
      select 1 from public.shows s
      where s.org_id = public.organizations.id
        and s.published = true
    )
  );
