-- BUG-VENDORSPACES-001 and BUG-RIDER-001: demo organizations were hidden from
-- every public / consumer-facing read, which broke two flows on the exact
-- shows used to demo the product:
--
--   - Vendor "Reserve Space" (Discover) showed "Nothing available" for a
--     fully-published demo-org show (QA-VendorChain-2026-08-11, 7 vendor
--     spaces at unlimited quantity, org "Peachtree Dressage Association",
--     is_demo = true).
--   - The public rider ticket page /rider/shows/[showId] returned HTTP 404 for
--     the same class of show: getPublicShowForRider's `shows` read resolves to
--     null under RLS, so the page calls notFound().
--
-- Three read gates deliberately excluded demo orgs:
--
--   - org_is_public()            → backs shows_select_published (the public
--     `shows` read — both the vendor feed and the rider ticket page).
--   - show_is_publicly_visible() → backs classes_select_published, so even if
--     the show became visible, its classes would not load on the rider page.
--   - organizations_select_public_show_owner → lets a vendor read the owning
--     org's name for the Discover feed.
--
-- Demo orgs are exactly the ones the product is demoed and tested with, so
-- hiding their shows made these flows undemoable end to end. This relaxes all
-- three gates to admit demo orgs. The suspended / deleted exclusions stay in
-- place, so a suspended or deleted org is still never publicly visible even if
-- one of its shows is stale-published.

create or replace function public.org_is_public(target_org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organizations
    where id = target_org_id
      and suspended = false
      and deleted_at is null
  );
$$;

create or replace function public.show_is_publicly_visible(target_show_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.shows s
    join public.organizations o on o.id = s.org_id
    where s.id = target_show_id
      and s.published = true
      and o.suspended = false
      and o.deleted_at is null
  );
$$;

drop policy if exists organizations_select_public_show_owner on public.organizations;
create policy organizations_select_public_show_owner on public.organizations
  for select
  using (
    suspended = false
    and deleted_at is null
    and exists (
      select 1 from public.shows s
      where s.org_id = public.organizations.id
        and s.published = true
    )
  );
