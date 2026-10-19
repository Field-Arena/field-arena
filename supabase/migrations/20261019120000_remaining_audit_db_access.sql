-- Remaining database-access items from FIELD-ARENA-AUDIT.md (2026-10-15).
-- Re-runnable. NOT applied anywhere yet — apply to a non-production Supabase
-- project and test before production.
--
-- Already fixed by earlier migrations and verified, so not repeated here:
--   * abandon_stale_orders / resolve_show_entry_numbering / assign_bridle_number
--     EXECUTE revoked from anon (20261002120000 H5).
--   * horses_update_document_approval limited to document_uploads
--     (20261002120000 trigger horses_non_owner_document_only).
--   * vendor booking items must match the booking's show, anon items only into
--     a fresh empty booking (20261002120000 H14).
--   * merch_sales_insert needs canEditShow — Vendor/Announcer seats don't hold
--     it (20261002120000).
--   * venues_select narrowed to organizer-side roles (20261002120000).
--   * horse documents storage read limited to show operations
--     (20261018124000 fa_horse_docs_staff_read).
--
-- Sections below:
--   1. EXECUTE grants on SECURITY DEFINER functions
--   2. Staff / vendor identity: user_id first, email only when confirmed
--   3. Anonymous vendor bookings can't set money columns
--   4. Vendor documents storage read limited to vendor managers
--   5. class_entries delete trigger allows parent cascades

-- ---------------------------------------------------------------------------
-- 1. EXECUTE on SECURITY DEFINER functions
-- ---------------------------------------------------------------------------
-- Supabase grants EXECUTE on public functions to anon and authenticated
-- directly, so every definer function is reachable at /rest/v1/rpc/<name>.
--
-- A function referenced directly by an RLS policy that applies to anon (no
-- `to authenticated` clause) must stay executable by anon: Postgres checks
-- EXECUTE when it builds the policy expression, so revoking it would make
-- every anonymous read of that table fail (public show pages, vendor apply).
-- Those predicates only answer questions about the caller and return false
-- for anon, so they are left as they are:
--   can_access_org, can_browse_venue_directory, can_manage_org_test_templates,
--   can_manage_show, can_view_show, has_show_permission, has_staff_assignment,
--   has_staff_on_org, is_super_admin, current_org_id, current_platform_role,
--   class_show_id, booking_show_id, horse_in_approvable_show, entry_is_own,
--   entry_is_own_and_published, class_results_published, show_is_published,
--   org_is_public, show_is_publicly_visible, booking_accepts_public_items.
--
-- Already restricted by earlier migrations (unchanged): abandon_stale_orders,
-- assign_bridle_number, resolve_show_entry_numbering,
-- reconcile_show_entry_numbering, can_view_rider_data, rider_in_rider_data_show,
-- horse_in_rider_data_show, is_class_panel_member, class_current_ride_index,
-- class_ride_in_ring, class_unscored_ride_count, effective_test_for_entry,
-- score_sheet_is_complete, org_is_active, show_org_is_active.
--
-- Revoked here:
--   Trigger functions — never meant to be called directly. EXECUTE is checked
--   when a trigger is created, not each time it fires, so the triggers keep
--   working.
revoke execute on function public.assert_class_entries_holding_permission() from public, anon, authenticated;
revoke execute on function public.assert_class_entries_scoring_permission() from public, anon, authenticated;
revoke execute on function public.assert_classes_write_permission() from public, anon, authenticated;
revoke execute on function public.assert_order_check_scribe_seat() from public, anon, authenticated;
revoke execute on function public.assert_ride_action_permission() from public, anon, authenticated;
revoke execute on function public.assert_scores_reopen_permission() from public, anon, authenticated;
revoke execute on function public.assert_scores_seat_ownership() from public, anon, authenticated;
revoke execute on function public.assert_scribe_mark_precedence() from public, anon, authenticated;
revoke execute on function public.assert_vendor_booking_item_same_show() from public, anon, authenticated;
revoke execute on function public.audit_row_change() from public, anon, authenticated;

--   No policy and no app caller left (superseded by 20261018124000 /
--   20261002120000): service role only.
revoke execute on function public.horse_in_viewable_show(uuid) from public, anon, authenticated;
revoke execute on function public.rider_in_viewable_show(uuid) from public, anon, authenticated;
revoke execute on function public.booking_is_pending(uuid) from public, anon, authenticated;
grant execute on function public.horse_in_viewable_show(uuid) to service_role;
grant execute on function public.rider_in_viewable_show(uuid) to service_role;
grant execute on function public.booking_is_pending(uuid) to service_role;

--   Only used from other definer functions or from SECURITY INVOKER triggers
--   that run as the signed-in user: anon has no use for them.
--   scores_seat_role       definer triggers on scores
--   entry_show_id          definer helpers
--   is_rider               no policy references it any more
--   can_access_show_org    invoker trigger staff_assignments_grant_scope
--                          (authenticated must keep it)
revoke execute on function public.scores_seat_role(uuid, text) from public, anon;
revoke execute on function public.entry_show_id(uuid) from public, anon;
revoke execute on function public.is_rider() from public, anon;
revoke execute on function public.can_access_show_org(uuid) from public, anon;
grant execute on function public.scores_seat_role(uuid, text) to authenticated, service_role;
grant execute on function public.entry_show_id(uuid) to authenticated, service_role;
grant execute on function public.is_rider() to authenticated, service_role;
grant execute on function public.can_access_show_org(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Staff / vendor identity: user_id first, email only when confirmed
-- ---------------------------------------------------------------------------
-- Staff seats (staff_assignments.email), invites and vendor bookings
-- (vendor_bookings.contact) are matched to the caller by user_id or by email.
-- The email came from the JWT (or public.users.email, which is copied from
-- auth at sign-up). With email confirmation off, anyone could sign up as an
-- invited-but-unaccepted address and inherit that seat.
--
-- auth_verified_email() is the caller's auth email only once Supabase Auth has
-- confirmed it (auth.users.email_confirmed_at). Null otherwise — and null
-- never equals anything, so an unconfirmed account falls back to user_id
-- matching only. Callable by anon because anon-applicable policies use it; it
-- only ever returns the caller's own address.
--
-- NOTE: when "Confirm email" is disabled in Supabase Auth, GoTrue stamps
-- email_confirmed_at at sign-up, so this only closes the hole once email
-- confirmation is turned on for the project.
create or replace function public.auth_verified_email()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(u.email)
  from auth.users u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null;
$$;

revoke execute on function public.auth_verified_email() from public;
grant execute on function public.auth_verified_email() to anon, authenticated, service_role;

-- Supersedes 20261002133000_admin_followups.sql (email match only).
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
  select public.show_org_is_active(target_show_id)
     and exists (
       select 1
       from public.staff_assignments sa
       where sa.show_id = target_show_id
         and (
           sa.user_id = auth.uid()
           or lower(sa.email) = public.auth_verified_email()
         )
         and (allowed_roles is null or sa.role = any (allowed_roles))
     );
$$;

-- Supersedes 20261002133000_admin_followups.sql (email match only).
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
      "canManageHoldingQueue": true, "canManageEntryLedger": true
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
    "canRefund": false, "canManageEntryLedger": false
  }'::jsonb;
begin
  -- Not subject to per-person grants.
  if public.is_super_admin() then
    return true;
  end if;

  -- Suspended or deleted org: nobody but SuperAdmin acts on its shows.
  if not public.show_org_is_active(target_show_id) then
    return false;
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

  if exists (
    select 1
    from public.shows s
    join public.organization_owners oo on oo.org_id = s.org_id
    where s.id = target_show_id
      and oo.user_id = auth.uid()
  ) then
    return true;
  end if;

  -- A user_id-linked row wins over an email-matched one.
  select *
    into sa
    from public.staff_assignments
   where show_id = target_show_id
     and (
       user_id = auth.uid()
       or lower(email) = public.auth_verified_email()
     )
   order by (user_id = auth.uid()) desc nulls last
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

-- Supersedes 20260727121300_fix_rls_recursion.sql (email match only).
create or replace function public.has_staff_on_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff_assignments sa
    join public.shows s on s.id = sa.show_id
    where s.org_id = target_org_id
      and (
        sa.user_id = auth.uid()
        or lower(sa.email) = public.auth_verified_email()
      )
  );
$$;

-- Supersedes 20261018120000_scoring_panel_moves_ring_pointer.sql (email match only).
create or replace function public.is_class_panel_member(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_panel cp
    join public.classes c on c.id = cp.class_id
    join public.staff_assignments sa
      on sa.show_id = c.show_id
     and sa.id in (cp.judge_staff_id, cp.scribe_staff_id)
    where cp.class_id = p_class_id
      and public.show_org_is_active(c.show_id)
      and (
        sa.user_id = auth.uid()
        or lower(sa.email) = public.auth_verified_email()
      )
  );
$$;

-- Supersedes 20260916130000_test_templates_show_admin_access.sql (email match only).
create or replace function public.can_manage_org_test_templates(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_access_org(target_org_id)
      or exists (
        select 1
        from public.staff_assignments sa
        join public.shows s on s.id = sa.show_id
        where s.org_id = target_org_id
          and sa.role = 'Show Admin'
          and public.org_is_active(target_org_id)
          and (
            sa.user_id = auth.uid()
            or lower(sa.email) = public.auth_verified_email()
          )
      );
$$;

-- Supersedes 20261002120000_audit_security_fixes.sql (email match only).
create or replace function public.can_browse_venue_directory()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_platform_role() in ('SuperAdmin', 'Organizer', 'ShowAdmin')
      or exists (
        select 1 from public.staff_assignments sa
        where sa.role = 'Show Admin'
          and (
            sa.user_id = auth.uid()
            or lower(sa.email) = public.auth_verified_email()
          )
      );
$$;

-- Supersedes 20260907140000_scribe_mark_ownership.sql. Was matched on
-- public.users.email, which is copied from an unconfirmed sign-up too.
create or replace function public.scores_seat_role(p_class_id uuid, p_seat_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1 from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = p_class_id and p.seat_id = p_seat_id
        and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
    ) then 'judge'
    when exists (
      select 1 from public.class_panel p
      join public.staff_assignments sa on sa.id = p.scribe_staff_id
      where p.class_id = p_class_id and p.seat_id = p_seat_id
        and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
    ) then 'scribe'
    else null
  end;
$$;

-- Supersedes 20260907130000_judge_action_and_signature_gates.sql (identity
-- match only).
create or replace function public.assert_scores_reopen_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  show uuid := public.class_show_id(new.class_id);
begin
  -- Clearing a signature = reopening. Unchanged from the original.
  if old.signed_by is not null and new.signed_by is null then
    if not public.has_show_permission(show, 'canEditShow') then
      raise exception 'not authorized to reopen a signed scoresheet';
    end if;
    return new;
  end if;

  -- Applying or replacing a signature: only the judge holding THIS seat may do
  -- it.
  if new.signed_by is distinct from old.signed_by and new.signed_by is not null then
    if not exists (
      select 1
      from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = new.class_id
        and p.seat_id = new.seat_id
        and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
    ) then
      raise exception 'Only the judge on this seat can sign this scoresheet.';
    end if;
  end if;

  return new;
end;
$$;

-- Supersedes 20260921150000_class_order_checks.sql (identity match only).
create or replace function public.assert_order_check_scribe_seat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  show_id uuid := public.class_show_id(new.class_id);
begin
  if public.has_show_permission(show_id, 'canEditShow') then
    return new;
  end if;

  if not exists (
    select 1
    from public.class_panel p
    join public.staff_assignments sa on sa.id = p.scribe_staff_id
    where p.class_id = new.class_id
      and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
  ) then
    raise exception 'You are not assigned as a scribe on this class.';
  end if;

  return new;
end;
$$;

-- Invites addressed to the caller. Supersedes 20260727120900_rls.sql.
drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select using (
    lower(email) = public.auth_verified_email()
    or (org_id is not null and public.can_access_org(org_id))
    or (show_id is not null and public.can_manage_show(show_id))
  );

-- Vendor's own bookings. Supersedes 20260806140000_vendor_self_service.sql.
drop policy if exists vendor_bookings_select_own on public.vendor_bookings;
create policy vendor_bookings_select_own on public.vendor_bookings
  for select
  using (
    contact is not null
    and lower(contact) = public.auth_verified_email()
  );

drop policy if exists vendor_bookings_insert_self on public.vendor_bookings;
create policy vendor_bookings_insert_self on public.vendor_bookings
  for insert
  with check (
    status = 'pending'
    and contact is not null
    and lower(contact) = public.auth_verified_email()
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

drop policy if exists vendor_bookings_update_own on public.vendor_bookings;
create policy vendor_bookings_update_own on public.vendor_bookings
  for update
  using (
    contact is not null
    and lower(contact) = public.auth_verified_email()
  )
  with check (
    contact is not null
    and lower(contact) = public.auth_verified_email()
  );

drop policy if exists vendor_booking_items_select_own on public.vendor_booking_items;
create policy vendor_booking_items_select_own on public.vendor_booking_items
  for select
  using (
    exists (
      select 1 from public.vendor_bookings b
      where b.id = booking_id
        and lower(b.contact) = public.auth_verified_email()
    )
  );

drop policy if exists vendor_booking_items_insert_self on public.vendor_booking_items;
create policy vendor_booking_items_insert_self on public.vendor_booking_items
  for insert
  with check (
    exists (
      select 1 from public.vendor_bookings b
      where b.id = booking_id
        and b.status = 'pending'
        and lower(b.contact) = public.auth_verified_email()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Anonymous vendor bookings can't set money columns
-- ---------------------------------------------------------------------------
-- vendor_bookings_insert_anon / _insert_self only check status, contact and
-- the show, so a direct POST to /rest/v1/vendor_bookings could arrive with
-- amount_total, paid_at, stripe_payment_intent_id, fee_total, refund columns
-- or a review reason already filled in. Checkout re-prices, but those columns
-- feed revenue totals and the "paid" state.
--
-- Column-level INSERT, same fail-closed shape as the UPDATE grant in
-- 20260806140000: only the columns the user-client inserts in src actually
-- send (vendors/data/mutations.ts insertPendingVendorBooking,
-- staff/data/mutations.ts add-vendor, organizations/data/mutations.ts member
-- import). Everything else takes its default. Money, Stripe and agreement
-- columns are written by the service-role client (webhook, checkout, sales),
-- which bypasses table grants.
revoke insert on public.vendor_bookings from anon, authenticated;
grant insert (
  id, show_id, name, contact, contact_name, phone, website,
  products_offered, special_requests, status
) on public.vendor_bookings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Vendor documents: only people who manage vendors read them
-- ---------------------------------------------------------------------------
-- fa_vendor_docs_staff_read used can_view_show, which admits every staff seat
-- on the show (Judge, Scribe, Announcer, other Vendors). The vendor's own
-- insurance certificates and licences are for whoever reviews vendors. No
-- staff screen in src reads this bucket today; the vendor's own access
-- (fa_vendor_docs_owner) is unchanged.
drop policy if exists "fa_vendor_docs_staff_read" on storage.objects;
create policy "fa_vendor_docs_staff_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vendor-docs'
    and (
      public.can_manage_show(
        public.booking_show_id(public.safe_uuid((storage.foldername(name))[2]))
      )
      or public.has_show_permission(
        public.booking_show_id(public.safe_uuid((storage.foldername(name))[2])),
        'canManageVendors'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. class_entries delete trigger allows parent cascades
-- ---------------------------------------------------------------------------
-- assert_class_entries_holding_permission (20260806130000) resolves the show
-- through class_show_id(class_id). When a show or class is deleted, the FK
-- cascade deletes the class row first, so class_show_id returns null and
-- has_show_permission(null, ...) is false: deleting a show with entries
-- failed for an Organizer, and always failed for the service role and
-- migrations (no auth.uid()).
--
-- Now:
--   * service role and sessions with no JWT (migrations, cron, psql) pass —
--     auth.role() is how a definer function tells them apart;
--   * a DELETE whose class row is already gone is a cascade from deleting
--     that class (or its show / org). That parent delete was authorized by
--     its own RLS policy, so the entry delete is not re-checked;
--   * everything else is unchanged.
-- Not STABLE: a volatile plpgsql body takes a fresh snapshot per query, which
-- is what makes the parent row's deletion visible to the exists() check.
create or replace function public.assert_class_entries_holding_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_class_id uuid := coalesce(new.class_id, old.class_id);
begin
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE'
     and not exists (select 1 from public.classes c where c.id = target_class_id) then
    return old;
  end if;

  if (tg_op = 'INSERT' and new.holding = true)
     or (tg_op = 'DELETE' and old.holding = true) then
    if not public.has_show_permission(public.class_show_id(target_class_id), 'canManageHoldingQueue') then
      raise exception 'not authorized to manage the holding queue for this class';
    end if;
  end if;

  if tg_op = 'DELETE' and old.holding = false then
    if not public.has_show_permission(public.class_show_id(target_class_id), 'canEditShow') then
      raise exception 'not authorized to remove entries from this class';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.assert_class_entries_holding_permission() from public, anon, authenticated;
