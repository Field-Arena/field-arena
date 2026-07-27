-- Fixes infinite recursion in the RLS policies (Postgres 42P17).
--
-- The bug: a policy that reads another table triggers *that* table's policies,
-- and if the second table's policy reads back the first, evaluation never
-- terminates. Two such cycles existed:
--
--   organizations_select      → SELECT ... FROM shows
--   shows_select_published    → SELECT ... FROM organizations   (cycle)
--
--   classes_select_published  → SELECT ... FROM shows
--   shows_select_published    → SELECT ... FROM organizations
--   organizations_select      → SELECT ... FROM shows           (cycle)
--
-- Every SELECT reached the database as "infinite recursion detected in policy
-- for relation", so the console could not load at all.
--
-- The fix is structural rather than a patch to one policy: every cross-table
-- lookup inside a policy now goes through a SECURITY DEFINER function. Those run
-- as the owner and therefore bypass RLS, which breaks the cycle by construction —
-- the same reason the existing is_super_admin/can_view_show helpers were written
-- that way. Doing it consistently also avoids re-evaluating a second table's
-- whole policy set on every row, which is a real cost on a roster query.
--
-- search_path is pinned on all of them so a mutable search_path cannot be used
-- to shadow these tables with attacker-controlled ones.

-- ---------------------------------------------------------------------------
-- Ownership lookups
-- ---------------------------------------------------------------------------
create or replace function public.class_show_id(target_class_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select show_id from public.classes where id = target_class_id;
$$;

create or replace function public.entry_show_id(target_entry_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select c.show_id
  from public.class_entries ce
  join public.classes c on c.id = ce.class_id
  where ce.id = target_entry_id;
$$;

create or replace function public.booking_show_id(target_booking_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select show_id from public.vendor_bookings where id = target_booking_id;
$$;

-- ---------------------------------------------------------------------------
-- Visibility predicates
-- ---------------------------------------------------------------------------
-- The rider-facing gate: an organization's shows are hidden when it is
-- suspended, soft-deleted, or one of the seeded demo organizations.
create or replace function public.org_is_public(target_org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organizations
    where id = target_org_id
      and suspended = false
      and deleted_at is null
      and is_demo = false
  );
$$;

create or replace function public.show_is_published(target_show_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.shows where id = target_show_id and published = true);
$$;

-- Published AND belonging to a visible organization — the full rider gate,
-- resolved in one call so policies never chain two tables together.
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
      and o.is_demo = false
  );
$$;

create or replace function public.class_results_published(target_class_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.classes where id = target_class_id and results_published = true
  );
$$;

-- Does the caller hold a staff assignment on ANY show this organization owns?
-- Replaces organizations_select's subquery over shows, which was one half of the
-- first cycle.
create or replace function public.has_staff_on_org(target_org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.staff_assignments sa
    join public.shows s on s.id = sa.show_id
    where s.org_id = target_org_id
      and (
        sa.user_id = auth.uid()
        or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Rider and horse reachability
-- ---------------------------------------------------------------------------
create or replace function public.rider_in_viewable_show(target_rider_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.rider_id = target_rider_id
      and public.can_view_show(c.show_id)
  );
$$;

create or replace function public.horse_in_viewable_show(target_horse_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.horse_id = target_horse_id
      and public.can_view_show(c.show_id)
  );
$$;

create or replace function public.horse_in_approvable_show(target_horse_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.horse_id = target_horse_id
      and public.has_show_permission(c.show_id, 'canApproveDocuments')
  );
$$;

-- A rider may read their own scoresheet, but only once the class is published.
create or replace function public.entry_is_own_and_published(target_entry_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.id = target_entry_id
      and ce.rider_id = auth.uid()
      and c.results_published = true
  );
$$;

create or replace function public.entry_is_own(target_entry_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.class_entries where id = target_entry_id and rider_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Recreate every policy that read another table directly
-- ---------------------------------------------------------------------------

-- Identity ------------------------------------------------------------------
drop policy if exists riders_select_by_show_staff on public.riders;
create policy riders_select_by_show_staff on public.riders
  for select using (public.is_super_admin() or public.rider_in_viewable_show(id));

-- Organizations and shows — the first cycle --------------------------------
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (public.can_access_org(id) or public.has_staff_on_org(id));

drop policy if exists shows_select_published on public.shows;
create policy shows_select_published on public.shows
  for select using (public.org_is_public(org_id) and published = true);

-- Show setup — the second cycle -------------------------------------------
drop policy if exists classes_select_published on public.classes;
create policy classes_select_published on public.classes
  for select using (public.show_is_publicly_visible(show_id));

drop policy if exists add_ons_select on public.add_ons;
create policy add_ons_select on public.add_ons
  for select using (public.can_view_show(show_id) or public.show_is_published(show_id));

drop policy if exists qual_types_select on public.qual_types;
create policy qual_types_select on public.qual_types
  for select using (public.can_view_show(show_id) or public.show_is_published(show_id));

drop policy if exists class_assignments_select on public.class_assignments;
create policy class_assignments_select on public.class_assignments
  for select using (public.can_view_show(public.class_show_id(class_id)));

drop policy if exists class_assignments_write on public.class_assignments;
create policy class_assignments_write on public.class_assignments
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canManageStaff'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canManageStaff'));

-- Vendors -----------------------------------------------------------------
drop policy if exists vendor_items_select on public.vendor_items;
create policy vendor_items_select on public.vendor_items
  for select using (public.can_view_show(show_id) or public.show_is_published(show_id));

drop policy if exists vendor_booking_items_select on public.vendor_booking_items;
create policy vendor_booking_items_select on public.vendor_booking_items
  for select using (public.can_view_show(public.booking_show_id(booking_id)));

drop policy if exists vendor_booking_items_write on public.vendor_booking_items;
create policy vendor_booking_items_write on public.vendor_booking_items
  for all using (
    public.has_show_permission(public.booking_show_id(booking_id), 'canManageVendors')
  )
  with check (
    public.has_show_permission(public.booking_show_id(booking_id), 'canManageVendors')
  );

-- Horses ------------------------------------------------------------------
drop policy if exists horses_select_by_show_staff on public.horses;
create policy horses_select_by_show_staff on public.horses
  for select using (public.horse_in_viewable_show(id));

drop policy if exists horses_update_document_approval on public.horses;
create policy horses_update_document_approval on public.horses
  for update using (public.horse_in_approvable_show(id)) with check (true);

-- Scoring ------------------------------------------------------------------
drop policy if exists class_tests_select on public.class_tests;
create policy class_tests_select on public.class_tests
  for select using (public.can_view_show(public.class_show_id(class_id)));

drop policy if exists class_tests_write on public.class_tests;
create policy class_tests_write on public.class_tests
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canEditShow'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canEditShow'));

drop policy if exists class_entries_select on public.class_entries;
create policy class_entries_select on public.class_entries
  for select using (
    rider_id = auth.uid() or public.can_view_show(public.class_show_id(class_id))
  );

drop policy if exists class_entries_select_published on public.class_entries;
create policy class_entries_select_published on public.class_entries
  for select using (public.class_results_published(class_id));

drop policy if exists class_entries_write on public.class_entries;
create policy class_entries_write on public.class_entries
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'));

drop policy if exists class_panel_select on public.class_panel;
create policy class_panel_select on public.class_panel
  for select using (public.can_view_show(public.class_show_id(class_id)));

drop policy if exists class_panel_write on public.class_panel;
create policy class_panel_write on public.class_panel
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canManageStaff'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canManageStaff'));

drop policy if exists scores_select on public.scores;
create policy scores_select on public.scores
  for select using (public.can_view_show(public.class_show_id(class_id)));

drop policy if exists scores_select_own_published on public.scores;
create policy scores_select_own_published on public.scores
  for select using (public.entry_is_own_and_published(entry_id));

drop policy if exists scores_write on public.scores;
create policy scores_write on public.scores
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'));
