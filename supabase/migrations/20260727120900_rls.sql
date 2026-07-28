-- Row Level Security — the security boundary.
--
-- architecture.md is explicit that permission checks happen in Postgres and
-- that application-layer checks are a UX optimization only. This file therefore
-- has to encode the whole authorization model that previously lived in
-- api/_lib/authz.js and api/_lib/permissions.js.
--
-- The model, unchanged from the legacy implementation:
--
--   SuperAdmin  Platform-wide. Can touch anything. This is a deliberate
--               support/impersonation capability, not an oversight.
--
--   Organizer   The account owner. Org-wide across every show their org owns.
--               Never has a staff_assignments row, and therefore implicitly
--               holds every granular permission.
--
--   ShowAdmin   NOT org-scoped. Access comes from a real staff_assignments row
--               tying them to ONE show. The legacy code called this out as a
--               fixed authorization bug: treating ShowAdmin as org-wide let a
--               ShowAdmin invited to one show reach every show in the org.
--
--   Judge / Scribe / Announcer / ShowStaff / Vendor
--               Per-show, via staff_assignments. The assignment row's OWN role
--               is the source of truth for what they may do on that show — not
--               the user's global platform_role. Those normally agree (both come
--               from the same invite) but the row is authoritative.
--
-- Legacy matched staff rows by EMAIL because staff_assignments.user_id was only
-- populated at invite-acceptance time. The helpers below match on user_id first
-- and fall back to email, so a staffed-but-not-yet-accepted person behaves
-- exactly as before while accepted users get a real foreign-key match.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
-- All SECURITY DEFINER. This is load-bearing, not incidental: a policy on
-- public.users that queried public.users through a normal function would
-- recurse infinitely. SECURITY DEFINER runs as the owner and bypasses RLS,
-- breaking the cycle. search_path is pinned on every one of them so a mutable
-- search_path cannot be used to shadow these tables.

create or replace function public.current_platform_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select platform_role from public.users where id = auth.uid();
$$;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select org_id from public.users where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and platform_role = 'SuperAdmin'
  );
$$;

create or replace function public.is_rider()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.riders where id = auth.uid());
$$;

-- Organizer-or-better for one organization. ShowAdmin is deliberately not
-- admitted: org-level resources (org-wide billing, the member database) are not
-- scoped to any single show, so there is no per-show check that would make
-- sense to apply here.
create or replace function public.can_access_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin()
      or exists (
        select 1 from public.users
        where id = auth.uid()
          and platform_role = 'Organizer'
          and org_id = target_org_id
      );
$$;

-- Does the caller hold a staff_assignments row for this show? Optionally
-- narrowed to a set of roles. Matches on user_id, falling back to email.
create or replace function public.has_staff_assignment(
  target_show_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff_assignments sa
    where sa.show_id = target_show_id
      and (
        sa.user_id = auth.uid()
        or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
      and (allowed_roles is null or sa.role = any (allowed_roles))
  );
$$;

-- Full management rights over a show: SuperAdmin, the Organizer whose org owns
-- it, or a ShowAdmin actually staffed on it.
create or replace function public.can_manage_show(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin()
      or exists (
        select 1
        from public.shows s
        join public.users u on u.id = auth.uid()
        where s.id = target_show_id
          and u.platform_role = 'Organizer'
          and u.org_id = s.org_id
      )
      or public.has_staff_assignment(target_show_id, array['Show Admin']);
$$;

-- Any legitimate participant in a show's operation — the read boundary for
-- rosters, ride order, schedules and scoresheets.
create or replace function public.can_view_show(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_manage_show(target_show_id)
      or public.has_staff_assignment(target_show_id);
$$;

-- The SQL equivalent of resolvePermissions() in api/_lib/permissions.js.
-- Merge order is identical and load-bearing:
--   1. every key false
--   2. role defaults
--   3. the two legacy single-flag columns
--   4. the explicit per-person `permissions` jsonb — always wins
--
-- SuperAdmin and Organizer short-circuit to true: neither is a
-- staff_assignments row at all, so there is nothing to resolve.
create or replace function public.has_show_permission(
  target_show_id uuid,
  permission_key text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  sa public.staff_assignments;
  resolved jsonb;
  role_defaults jsonb := '{
    "Show Admin": {
      "canScratch": true, "canSkip": true, "canEliminate": true,
      "canEditShow": true, "canManageStaff": true, "canManageVendors": true,
      "canApproveDocuments": true, "canEnterScores": true,
      "canPublishShow": true, "canExportRoster": true,
      "canManageHoldingQueue": true
    },
    "Judge": {
      "canScratch": true, "canSkip": true, "canEliminate": true,
      "canEnterScores": true
    },
    "Scribe": {
      "canScratch": true, "canSkip": true, "canEliminate": true,
      "canEnterScores": true
    },
    "Announcer": {},
    "ShowStaff": {},
    "Vendor": {}
  }'::jsonb;
  all_false jsonb := '{
    "canScratch": false, "canSkip": false, "canEliminate": false,
    "canViewMoney": false, "canEditShow": false, "canManageStaff": false,
    "canManageVendors": false, "canApproveDocuments": false,
    "canEnterScores": false, "canPublishShow": false,
    "canExportRoster": false, "canManageHoldingQueue": false,
    "canRefund": false
  }'::jsonb;
begin
  -- Not subject to per-person grants.
  if public.is_super_admin() then
    return true;
  end if;

  if exists (
    select 1
    from public.shows s
    join public.users u on u.id = auth.uid()
    where s.id = target_show_id
      and u.platform_role = 'Organizer'
      and u.org_id = s.org_id
  ) then
    return true;
  end if;

  select *
    into sa
    from public.staff_assignments
   where show_id = target_show_id
     and (
       user_id = auth.uid()
       or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     )
   limit 1;

  if sa.id is null then
    return false;
  end if;

  resolved := all_false || coalesce(role_defaults -> sa.role, '{}'::jsonb);

  -- The superseded single toggle still grants all three ride-day actions.
  if coalesce(sa.can_scratch_skip_dq, false) then
    resolved := resolved || '{"canScratch": true, "canSkip": true, "canEliminate": true}'::jsonb;
  end if;

  if coalesce(sa.can_view_money, false) then
    resolved := resolved || '{"canViewMoney": true}'::jsonb;
  end if;

  resolved := resolved || coalesce(sa.permissions, '{}'::jsonb);

  return coalesce((resolved ->> permission_key)::boolean, false);
end;
$$;

comment on function public.has_show_permission(uuid, text) is
  'SQL port of resolvePermissions() — role defaults, then legacy flag columns, then the explicit per-person permissions jsonb.';

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
-- Without this, the anon key can read every table. Enabling RLS with no policy
-- denies all access by default, which is the correct starting point.
alter table public.organizations       enable row level security;
alter table public.venues              enable row level security;
alter table public.users               enable row level security;
alter table public.riders              enable row level security;
alter table public.shows               enable row level security;
alter table public.role_assignments    enable row level security;
alter table public.divisions           enable row level security;
alter table public.classes             enable row level security;
alter table public.staff_assignments   enable row level security;
alter table public.class_assignments   enable row level security;
alter table public.member_database     enable row level security;
alter table public.add_ons             enable row level security;
alter table public.qual_types          enable row level security;
alter table public.independent_sheets  enable row level security;
alter table public.invites             enable row level security;
alter table public.vendor_items        enable row level security;
alter table public.vendor_bookings     enable row level security;
alter table public.vendor_booking_items enable row level security;
alter table public.horses              enable row level security;
alter table public.waiver_signatures   enable row level security;
alter table public.orders              enable row level security;
alter table public.class_tests         enable row level security;
alter table public.class_entries       enable row level security;
alter table public.class_panel         enable row level security;
alter table public.scores              enable row level security;
alter table public.scoring_catalog     enable row level security;
alter table public.test_templates      enable row level security;
alter table public.documents           enable row level security;
alter table public.catalog_documents   enable row level security;
alter table public.merch_sales         enable row level security;
alter table public.leads               enable row level security;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create policy users_select_self on public.users
  for select using (id = auth.uid());

-- Staff can see colleagues in their own org; SuperAdmin sees everyone.
create policy users_select_org on public.users
  for select using (
    public.is_super_admin()
    or (org_id is not null and org_id = public.current_org_id())
  );

create policy users_update_self on public.users
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- A user cannot promote themselves or move themselves between orgs.
    and platform_role is not distinct from public.current_platform_role()
    and org_id is not distinct from public.current_org_id()
  );

create policy users_super_admin_all on public.users
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy riders_select_self on public.riders
  for select using (id = auth.uid());

create policy riders_insert_self on public.riders
  for insert with check (id = auth.uid());

create policy riders_update_self on public.riders
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Show staff need to see the riders entered in their show.
create policy riders_select_by_show_staff on public.riders
  for select using (
    public.is_super_admin()
    or exists (
      select 1
      from public.class_entries ce
      join public.classes c on c.id = ce.class_id
      where ce.rider_id = public.riders.id
        and public.can_view_show(c.show_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Organizations and venues
-- ---------------------------------------------------------------------------
create policy organizations_select on public.organizations
  for select using (
    public.can_access_org(id)
    -- Staff assigned to any show this org owns need the org's display info.
    or exists (
      select 1 from public.shows s
      where s.org_id = public.organizations.id
        and public.has_staff_assignment(s.id)
    )
  );

create policy organizations_super_admin_all on public.organizations
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy organizations_update_own on public.organizations
  for update using (public.can_access_org(id)) with check (public.can_access_org(id));

create policy venues_select on public.venues
  for select using (public.can_access_org(org_id));

create policy venues_write on public.venues
  for all using (public.can_access_org(org_id)) with check (public.can_access_org(org_id));

-- ---------------------------------------------------------------------------
-- Shows
-- ---------------------------------------------------------------------------
create policy shows_select_staff on public.shows
  for select using (public.can_view_show(id));

-- Riders browsing the catalogue see published shows belonging to orgs that are
-- neither suspended, soft-deleted, nor demo — the same 404-style gate the
-- legacy rider endpoints applied.
create policy shows_select_published on public.shows
  for select using (
    published = true
    and exists (
      select 1 from public.organizations o
      where o.id = public.shows.org_id
        and o.suspended = false
        and o.deleted_at is null
        and o.is_demo = false
    )
  );

create policy shows_insert on public.shows
  for insert with check (public.can_access_org(org_id));

create policy shows_update on public.shows
  for update using (public.can_manage_show(id)) with check (public.can_manage_show(id));

create policy shows_delete on public.shows
  for delete using (public.can_access_org(org_id));

create policy role_assignments_select on public.role_assignments
  for select using (user_id = auth.uid() or public.can_view_show(show_id));

create policy role_assignments_write on public.role_assignments
  for all using (public.can_manage_show(show_id))
  with check (public.can_manage_show(show_id));

-- ---------------------------------------------------------------------------
-- Show setup
-- ---------------------------------------------------------------------------
-- Divisions, classes and the three catalogs share one shape: readable by
-- anyone who can view the show, writable by anyone with canEditShow.
create policy divisions_select on public.divisions
  for select using (public.can_view_show(show_id));
create policy divisions_write on public.divisions
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

create policy classes_select on public.classes
  for select using (public.can_view_show(show_id));
create policy classes_write on public.classes
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

-- Riders must be able to see the classes of a show they can enter.
create policy classes_select_published on public.classes
  for select using (
    exists (
      select 1 from public.shows s
      where s.id = public.classes.show_id and s.published = true
    )
  );

create policy add_ons_select on public.add_ons
  for select using (
    public.can_view_show(show_id)
    or exists (select 1 from public.shows s where s.id = public.add_ons.show_id and s.published = true)
  );
create policy add_ons_write on public.add_ons
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

create policy qual_types_select on public.qual_types
  for select using (
    public.can_view_show(show_id)
    or exists (select 1 from public.shows s where s.id = public.qual_types.show_id and s.published = true)
  );
create policy qual_types_write on public.qual_types
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

create policy independent_sheets_select on public.independent_sheets
  for select using (public.can_view_show(show_id));
create policy independent_sheets_write on public.independent_sheets
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

-- Staff management is its own permission, distinct from show editing.
create policy staff_assignments_select on public.staff_assignments
  for select using (public.can_view_show(show_id));
create policy staff_assignments_write on public.staff_assignments
  for all using (public.has_show_permission(show_id, 'canManageStaff'))
  with check (public.has_show_permission(show_id, 'canManageStaff'));

create policy class_assignments_select on public.class_assignments
  for select using (
    exists (select 1 from public.classes c where c.id = class_id and public.can_view_show(c.show_id))
  );
create policy class_assignments_write on public.class_assignments
  for all using (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canManageStaff'))
  )
  with check (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canManageStaff'))
  );

-- Org-wide, so gated on org access rather than any show.
create policy member_database_all on public.member_database
  for all using (public.can_access_org(org_id)) with check (public.can_access_org(org_id));

-- Invites are readable by whoever can manage the scope they belong to, plus the
-- invitee themselves (so the accept flow can resolve the invite).
create policy invites_select on public.invites
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or (org_id is not null and public.can_access_org(org_id))
    or (show_id is not null and public.can_manage_show(show_id))
  );

create policy invites_write on public.invites
  for all using (
    (org_id is not null and public.can_access_org(org_id))
    or (show_id is not null and public.has_show_permission(show_id, 'canManageStaff'))
    or public.is_super_admin()
  )
  with check (
    (org_id is not null and public.can_access_org(org_id))
    or (show_id is not null and public.has_show_permission(show_id, 'canManageStaff'))
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create policy vendor_items_select on public.vendor_items
  for select using (
    public.can_view_show(show_id)
    or exists (select 1 from public.shows s where s.id = public.vendor_items.show_id and s.published = true)
  );
create policy vendor_items_write on public.vendor_items
  for all using (public.has_show_permission(show_id, 'canManageVendors'))
  with check (public.has_show_permission(show_id, 'canManageVendors'));

create policy vendor_bookings_select on public.vendor_bookings
  for select using (public.can_view_show(show_id));
create policy vendor_bookings_write on public.vendor_bookings
  for all using (public.has_show_permission(show_id, 'canManageVendors'))
  with check (public.has_show_permission(show_id, 'canManageVendors'));

create policy vendor_booking_items_select on public.vendor_booking_items
  for select using (
    exists (select 1 from public.vendor_bookings b where b.id = booking_id
            and public.can_view_show(b.show_id))
  );
create policy vendor_booking_items_write on public.vendor_booking_items
  for all using (
    exists (select 1 from public.vendor_bookings b where b.id = booking_id
            and public.has_show_permission(b.show_id, 'canManageVendors'))
  )
  with check (
    exists (select 1 from public.vendor_bookings b where b.id = booking_id
            and public.has_show_permission(b.show_id, 'canManageVendors'))
  );

-- ---------------------------------------------------------------------------
-- Rider-owned data
-- ---------------------------------------------------------------------------
create policy horses_owner_all on public.horses
  for all using (rider_id = auth.uid()) with check (rider_id = auth.uid());

-- Staff need to see horses entered in their show, and document approval writes
-- back to document_uploads.
create policy horses_select_by_show_staff on public.horses
  for select using (
    exists (
      select 1
      from public.class_entries ce
      join public.classes c on c.id = ce.class_id
      where ce.horse_id = public.horses.id and public.can_view_show(c.show_id)
    )
  );

create policy horses_update_document_approval on public.horses
  for update using (
    exists (
      select 1
      from public.class_entries ce
      join public.classes c on c.id = ce.class_id
      where ce.horse_id = public.horses.id
        and public.has_show_permission(c.show_id, 'canApproveDocuments')
    )
  )
  with check (true);

create policy waiver_signatures_owner on public.waiver_signatures
  for all using (rider_id = auth.uid()) with check (rider_id = auth.uid());

create policy waiver_signatures_select_staff on public.waiver_signatures
  for select using (public.can_view_show(show_id));

-- Orders are readable by their rider and by show staff with money visibility.
-- Writes never come from a client: order creation and refunds go through
-- Server Actions using the service-role client, because the amounts must be
-- computed server-side and reconciled against Stripe.
create policy orders_select_owner on public.orders
  for select using (rider_id = auth.uid());

create policy orders_select_money_staff on public.orders
  for select using (public.has_show_permission(show_id, 'canViewMoney'));

-- ---------------------------------------------------------------------------
-- Scoring
-- ---------------------------------------------------------------------------
create policy class_tests_select on public.class_tests
  for select using (
    exists (select 1 from public.classes c where c.id = class_id and public.can_view_show(c.show_id))
  );
create policy class_tests_write on public.class_tests
  for all using (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEditShow'))
  )
  with check (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEditShow'))
  );

create policy class_entries_select on public.class_entries
  for select using (
    rider_id = auth.uid()
    or exists (select 1 from public.classes c where c.id = class_id and public.can_view_show(c.show_id))
  );

-- Published results are public to any authenticated user.
create policy class_entries_select_published on public.class_entries
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.results_published = true
    )
  );

create policy class_entries_write on public.class_entries
  for all using (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEnterScores'))
  )
  with check (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEnterScores'))
  );

create policy class_panel_select on public.class_panel
  for select using (
    exists (select 1 from public.classes c where c.id = class_id and public.can_view_show(c.show_id))
  );
create policy class_panel_write on public.class_panel
  for all using (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canManageStaff'))
  )
  with check (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canManageStaff'))
  );

create policy scores_select on public.scores
  for select using (
    exists (select 1 from public.classes c where c.id = class_id and public.can_view_show(c.show_id))
  );

-- A rider may read their own scoresheets, but only once the class is published.
create policy scores_select_own_published on public.scores
  for select using (
    exists (
      select 1
      from public.class_entries ce
      join public.classes c on c.id = ce.class_id
      where ce.id = public.scores.entry_id
        and ce.rider_id = auth.uid()
        and c.results_published = true
    )
  );

create policy scores_write on public.scores
  for all using (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEnterScores'))
  )
  with check (
    exists (select 1 from public.classes c where c.id = class_id
            and public.has_show_permission(c.show_id, 'canEnterScores'))
  );

-- The platform catalog is readable by every authenticated user (organizers pick
-- from it when building a show) and writable only by SuperAdmin.
create policy scoring_catalog_select on public.scoring_catalog
  for select to authenticated using (true);
create policy scoring_catalog_write on public.scoring_catalog
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy test_templates_all on public.test_templates
  for all using (public.can_access_org(org_id)) with check (public.can_access_org(org_id));

-- ---------------------------------------------------------------------------
-- Documents, merch, CRM
-- ---------------------------------------------------------------------------
create policy documents_select on public.documents
  for select using (public.can_view_show(show_id));
create policy documents_write on public.documents
  for all using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));

create policy catalog_documents_select on public.catalog_documents
  for select to authenticated using (true);
create policy catalog_documents_write on public.catalog_documents
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy merch_sales_select on public.merch_sales
  for select using (public.has_show_permission(show_id, 'canViewMoney'));
create policy merch_sales_insert on public.merch_sales
  for insert with check (public.can_view_show(show_id));

-- The sales CRM is SuperAdmin-only in its entirety.
create policy leads_super_admin_all on public.leads
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Column-level protection for payment identifiers
-- ---------------------------------------------------------------------------
-- RLS is row-level only, so a staff member who can read an organization row can
-- read every column on it — including its Stripe Connect account id. These
-- columns are only ever needed by server-side code holding the service-role
-- key, so the privilege is revoked from ordinary roles outright.
revoke select (stripe_connect_account_id) on public.organizations from authenticated, anon;
revoke select (stripe_customer_id, stripe_payment_method_id) on public.orders from authenticated, anon;
revoke select (stripe_customer_id, stripe_payment_method_id) on public.vendor_bookings from authenticated, anon;
