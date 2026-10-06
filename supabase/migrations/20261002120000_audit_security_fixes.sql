-- Security fixes from docs/audit/2026-10-02-initial-audit.md.
--
-- One migration for the database half of the audit's High security items
-- (H1, H2, H4, H5, the DB part of H14) plus the Medium/Low items that are
-- pure SQL. Each section is headed with its finding ID. Every statement is
-- written to be re-runnable (create or replace / drop ... if exists /
-- if not exists / a guarded DO block), so a partial apply can be finished by
-- running the file again.
--
-- "Trusted caller" below means the statement is not running as one of
-- PostgREST's end-user roles: the service-role (admin) client, a SECURITY
-- DEFINER function's own body, pg_cron, or a migration. Inside a SECURITY
-- INVOKER trigger function current_user is the role that issued the
-- statement, so this check is only meaningful from invoker code — it is NOT
-- used inside SECURITY DEFINER functions (where current_user is the owner);
-- those check auth.role() instead (see H5).

create or replace function public.is_trusted_db_role()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select current_user not in ('authenticated', 'anon')
      or coalesce(auth.role(), '') = 'service_role';
$$;

comment on function public.is_trusted_db_role() is
  'True when the current statement is not running as an end-user PostgREST role (service role, definer code, cron, migrations). Only meaningful from SECURITY INVOKER code. See 20261002120000.';

-- ---------------------------------------------------------------------------
-- H1 — users.email is not self-editable
-- ---------------------------------------------------------------------------
-- users_update_self only pins platform_role and org_id, so a signed-in user
-- could PATCH their own users.email to the address of a pending staff invite.
-- has_show_permission / has_staff_assignment fall back to matching on email,
-- and staff/data/mutations.ts provisionIfNewAccount links rows by email, so
-- that is an invite hijack. No app path changes users.email at all (the only
-- user-client write to users is onboarded_at in auth/data/mutations.ts);
-- emails are only ever written on INSERT through the admin client.
create or replace function public.assert_users_email_immutable()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email and not public.is_trusted_db_role() then
    raise exception 'Your account email can''t be changed here.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists users_email_immutable on public.users;
create trigger users_email_immutable
  before update on public.users
  for each row execute function public.assert_users_email_immutable();

-- ---------------------------------------------------------------------------
-- H2 — staff_assignments grants can't be self-escalated
-- ---------------------------------------------------------------------------
-- staff_assignments_write admits anyone holding canManageStaff on the show,
-- which by default is every Show Admin. RLS has no column granularity, so a
-- Show Admin could UPDATE their own row's permissions to {"canRefund": true,
-- "canViewMoney": true} and then refund or charge cards.
--
-- Unrestricted (the policy alone applies): trusted callers, SuperAdmin, and
-- the org owner / co-owner of the show's org (can_access_org). Everyone else
-- who got past staff_assignments_write (Show Admins and anyone else granted
-- canManageStaff) is narrowed to:
--
--   1. Never their own row. No INSERT of a row that matches them, no UPDATE
--      that re-points another row at them (email/user_id), and no change to
--      role / permissions / can_view_money / can_scratch_skip_dq on a row
--      that is theirs. Name/phone/licence on their own row stay editable.
--   2. Never money. can_view_money, permissions.canViewMoney and
--      permissions.canRefund can only be newly granted by the org.
--   3. Only grants they hold themselves. Any other permission key newly set
--      true needs has_show_permission(show, key) for the caller; the legacy
--      can_scratch_skip_dq toggle needs canScratch; making someone a
--      'Show Admin' needs the caller to be a staffed Show Admin.
--
-- "Newly" compares against the old row so the permissions dialog (which
-- always sends the full key set) keeps working: re-saving a key that was
-- already true is not a grant. Moving a row to another show (show_id change,
-- reassignStaffShow) treats every grant on it as new for the target show.
--
-- Small definer helper so the invoker trigger can resolve the show's org
-- without depending on the caller's SELECT on shows.
create or replace function public.can_access_show_org(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select public.can_access_org(s.org_id) from public.shows s where s.id = target_show_id),
    false
  );
$$;

-- What a staff row effectively grants: the same resolution has_show_permission
-- does (role defaults → legacy toggles → explicit permissions). The trigger
-- compares against this, not the raw permissions JSON, so re-saving a key that
-- was already on through the role default or can_view_money is not a "grant".
create or replace function public.resolve_staff_permissions(
  p_role text,
  p_permissions jsonb,
  p_can_scratch_skip_dq boolean,
  p_can_view_money boolean
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select
    '{
      "canScratch": false, "canSkip": false, "canEliminate": false,
      "canViewMoney": false, "canEditShow": false, "canManageStaff": false,
      "canManageVendors": false, "canApproveDocuments": false,
      "canEnterScores": false, "canPublishShow": false,
      "canExportRoster": false, "canManageHoldingQueue": false,
      "canRefund": false, "canManageEntryLedger": false
    }'::jsonb
    || coalesce(
      '{
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
        }
      }'::jsonb -> p_role,
      '{}'::jsonb
    )
    || case when coalesce(p_can_scratch_skip_dq, false)
         then '{"canScratch": true, "canSkip": true, "canEliminate": true}'::jsonb
         else '{}'::jsonb end
    || case when coalesce(p_can_view_money, false)
         then '{"canViewMoney": true}'::jsonb
         else '{}'::jsonb end
    || coalesce(p_permissions, '{}'::jsonb);
$$;

create or replace function public.assert_staff_assignment_grant_scope()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_jwt_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_new_is_self boolean;
  v_old_is_self boolean := false;
  v_old_perms jsonb := '{}'::jsonb;
  v_old_money boolean := false;
  v_old_ssd boolean := false;
  v_old_role text := null;
  v_new_perms jsonb := coalesce(new.permissions, '{}'::jsonb);
  v_old_raw jsonb := '{}'::jsonb;
  v_key text;
  v_value jsonb;
begin
  if public.is_trusted_db_role()
     or public.is_super_admin()
     or public.can_access_show_org(new.show_id) then
    return new;
  end if;

  -- coalesce: a null user_id must read as "not me", not as unknown, or
  -- `v_new_is_self and not v_old_is_self` below would silently be null.
  v_new_is_self := coalesce(new.user_id = auth.uid(), false)
    or (v_jwt_email <> '' and lower(coalesce(new.email, '')) = v_jwt_email);

  if tg_op = 'UPDATE' then
    v_old_is_self := coalesce(old.user_id = auth.uid(), false)
      or (v_jwt_email <> '' and lower(coalesce(old.email, '')) = v_jwt_email);

    -- Same show: compare against what the row already granted. Moved to a
    -- different show: nothing on it was granted there yet.
    -- Re-pointing the row at another person (email/user_id) carries its
    -- grants to them, so that is treated like a move: every grant is new.
    if new.show_id = old.show_id
       and new.email is not distinct from old.email
       and new.user_id is not distinct from old.user_id then
      v_old_raw := coalesce(old.permissions, '{}'::jsonb);
      v_old_perms := public.resolve_staff_permissions(
        old.role, old.permissions, old.can_scratch_skip_dq, old.can_view_money
      );
      v_old_money := coalesce(old.can_view_money, false);
      v_old_ssd := coalesce(old.can_scratch_skip_dq, false);
      v_old_role := old.role;
    end if;
  end if;

  -- 1. Own row.
  if tg_op = 'INSERT' and v_new_is_self then
    raise exception 'You can''t add yourself to a show''s staff.' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if v_new_is_self and not v_old_is_self then
      raise exception 'You can''t move another staff assignment onto your own account.'
        using errcode = '42501';
    end if;

    if v_old_is_self and (
      new.role is distinct from old.role
      or new.permissions is distinct from old.permissions
      or new.can_view_money is distinct from old.can_view_money
      or new.can_scratch_skip_dq is distinct from old.can_scratch_skip_dq
      or new.show_id is distinct from old.show_id
    ) then
      raise exception 'You can''t change your own role or permissions. Ask the show organizer.'
        using errcode = '42501';
    end if;
  end if;

  -- 2. Money.
  if coalesce(new.can_view_money, false) and not v_old_money then
    raise exception 'Only the show organizer can grant access to financial data.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(v_new_perms) <> 'object' then
    raise exception 'permissions must be a JSON object.' using errcode = '22023';
  end if;

  for v_key, v_value in select key, value from jsonb_each(v_new_perms) loop
    -- has_show_permission casts these with ::boolean, which also accepts
    -- strings like "t"/"yes". Only real JSON booleans are accepted from a
    -- non-owner so the "newly true" comparison below can't be sidestepped.
    -- A key left exactly as it was is not re-validated, so a legacy
    -- non-boolean value doesn't lock the row against name/phone edits.
    continue when (v_old_raw -> v_key) is not distinct from v_value;

    if jsonb_typeof(v_value) <> 'boolean' then
      raise exception 'Permission % must be true or false.', v_key using errcode = '22023';
    end if;

    continue when v_value <> 'true'::jsonb;
    continue when (v_old_perms -> v_key) = 'true'::jsonb;

    if v_key in ('canViewMoney', 'canRefund') then
      raise exception 'Only the show organizer can grant %.', v_key using errcode = '42501';
    end if;

    -- 3. Only what the caller holds.
    if not public.has_show_permission(new.show_id, v_key) then
      raise exception 'You can''t grant % because you don''t hold it on this show.', v_key
        using errcode = '42501';
    end if;
  end loop;

  if coalesce(new.can_scratch_skip_dq, false) and not v_old_ssd
     and not public.has_show_permission(new.show_id, 'canScratch') then
    raise exception 'You can''t grant scratch/skip/disqualify because you don''t hold it on this show.'
      using errcode = '42501';
  end if;

  if new.role = 'Show Admin' and new.role is distinct from v_old_role
     and not public.has_staff_assignment(new.show_id, array['Show Admin']) then
    raise exception 'Only a Show Admin or the show organizer can make someone a Show Admin.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists staff_assignments_grant_scope on public.staff_assignments;
create trigger staff_assignments_grant_scope
  before insert or update on public.staff_assignments
  for each row execute function public.assert_staff_assignment_grant_scope();

-- ---------------------------------------------------------------------------
-- H4 — organizations: Organizers may only edit profile columns
-- ---------------------------------------------------------------------------
-- organizations_update_own has no column limit, so an Organizer could PATCH
-- suspended, deleted_at, is_demo, fee_model, payout_cadence,
-- holdback_percent or stripe_connect_account_id on their own org.
--
-- The only user-client column set in src is the profile form
-- (organizations/data/mutations.ts updateOrganizationProfile: name, email,
-- website, phone, city, region, country). Same fail-closed shape as the
-- SELECT grant in 20260907120000: a column added later is not writable by
-- authenticated until someone grants it.
--
-- Column grants apply to the role, not the RLS policy, so this also covers
-- SuperAdmin acting through the user client: platform columns must now be
-- written with the service-role client (see report / audit fix plan).
revoke update on public.organizations from authenticated, anon;

grant update (
  name, email, website, phone, city, region, country
) on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- H5 — SECURITY DEFINER numbering / cleanup RPCs
-- ---------------------------------------------------------------------------
-- All three were executable by anon with no auth check of their own.
--
--   assign_bridle_number         user client, shows/data/bridle-number-mutations.ts
--                                (app checks canManageEntryLedger first). Keeps
--                                authenticated EXECUTE, gains its own check.
--   resolve_show_entry_numbering admin client only, shows/data/entry-numbering.ts.
--   abandon_stale_orders         pg_cron only (runs as the job owner).
--
-- assign_bridle_number body is unchanged from 20260922123000 apart from the
-- check at the top. auth.role() rather than is_trusted_db_role(): inside a
-- definer function current_user is the owner, never the caller.
create or replace function public.assign_bridle_number(
  p_show_id uuid,
  p_show_horse_id uuid,
  p_explicit_number integer default null,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_number text;
  v_new_number integer;
begin
  if not (
    coalesce(auth.role(), '') = 'service_role'
    or public.has_show_permission(p_show_id, 'canManageEntryLedger')
  ) then
    raise exception 'You don''t have permission to manage this show''s entry ledger.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_show_id::text));

  select bridle_number into v_old_number
    from public.show_horses
   where id = p_show_horse_id and show_id = p_show_id;
  if not found then
    raise exception 'That horse is not part of this show.' using errcode = 'FA010';
  end if;

  if p_explicit_number is not null then
    if not exists (
      select 1 from public.show_bridle_numbers
       where show_id = p_show_id and number = p_explicit_number and status = 'available'
    ) then
      raise exception 'That number is not available.' using errcode = 'FA011';
    end if;
    v_new_number := p_explicit_number;
  else
    select number into v_new_number
      from public.show_bridle_numbers
     where show_id = p_show_id and status = 'available'
     order by number
     limit 1;
    if v_new_number is null then
      raise exception 'No available bridle numbers remain in the defined pool.' using errcode = 'FA012';
    end if;
  end if;

  -- Retire the old number, but only if it's actually a pool number — legacy
  -- bridle numbers assigned before this feature existed may not match the
  -- `^\d+$` shape (or any show_bridle_numbers row) and should just be
  -- dropped, not crash the replace.
  if v_old_number is not null and v_old_number ~ '^\d+$' then
    update public.show_bridle_numbers
       set status = 'unavailable', unavailable_reason = p_reason, show_horse_id = null
     where show_id = p_show_id and number = v_old_number::integer;
  end if;

  update public.show_bridle_numbers
     set status = 'assigned', show_horse_id = p_show_horse_id, unavailable_reason = null
   where show_id = p_show_id and number = v_new_number;

  update public.show_horses set bridle_number = v_new_number::text where id = p_show_horse_id;

  insert into public.bridle_number_changes (show_id, show_horse_id, old_number, new_number, reason, changed_by)
    values (p_show_id, p_show_horse_id, v_old_number, v_new_number::text, p_reason, auth.uid());

  return v_new_number::text;
end;
$$;

-- Supabase grants EXECUTE on new public functions to anon/authenticated
-- directly (not only via PUBLIC), so all three roles are revoked.
revoke execute on function public.assign_bridle_number(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke execute on function public.resolve_show_entry_numbering(uuid)
  from public, anon, authenticated;
revoke execute on function public.abandon_stale_orders()
  from public, anon, authenticated;

grant execute on function public.assign_bridle_number(uuid, uuid, integer, text)
  to authenticated, service_role;
grant execute on function public.resolve_show_entry_numbering(uuid) to service_role;
grant execute on function public.abandon_stale_orders() to service_role;

-- ---------------------------------------------------------------------------
-- H14 (DB part) — vendor booking line items
-- ---------------------------------------------------------------------------
-- (a) vendor_booking_items_insert_anon let anyone add line items to ANY
-- pending booking whose id they knew, at any time. The legit public flow
-- (vendors/data/mutations.ts insertPendingVendorBooking, via
-- applyToShowPublic) inserts the booking and then all of its items in one
-- multi-row INSERT straight after. So the anon path now only admits items for
-- a pending booking that is minutes old and has no items yet.
--
-- "Has no items yet" works for the one multi-row INSERT because this helper
-- is STABLE: it reads with the calling statement's snapshot, so rows inserted
-- by that same statement are not visible to it, while any earlier statement's
-- rows are. A second INSERT against the same booking is refused.
--
-- A signed-in vendor adding to their own pending booking is unaffected —
-- that is vendor_booking_items_insert_self (20260806140000), matched on the
-- JWT email.
create or replace function public.booking_accepts_public_items(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vendor_bookings b
    where b.id = target_booking_id
      and b.status = 'pending'
      and b.created_at > now() - interval '15 minutes'
      and not exists (
        select 1 from public.vendor_booking_items i where i.booking_id = b.id
      )
  );
$$;

drop policy if exists vendor_booking_items_insert_anon on public.vendor_booking_items;
create policy vendor_booking_items_insert_anon on public.vendor_booking_items
  for insert
  with check (public.booking_accepts_public_items(booking_id));

-- (b) Nothing tied a line item's vendor_item to the booking's show, on any
-- write path (anon, self, staff or admin). Definer so the anon apply flow,
-- which can't SELECT vendor_bookings, still gets the check.
create or replace function public.assert_vendor_booking_item_same_show()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.vendor_bookings b
    join public.vendor_items vi on vi.show_id = b.show_id
    where b.id = new.booking_id
      and vi.id = new.vendor_item_id
  ) then
    raise exception 'That item isn''t offered at this booking''s show.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_booking_items_same_show on public.vendor_booking_items;
create trigger vendor_booking_items_same_show
  before insert or update of booking_id, vendor_item_id on public.vendor_booking_items
  for each row execute function public.assert_vendor_booking_item_same_show();

-- ---------------------------------------------------------------------------
-- Medium — horses_update_document_approval is document-only
-- ---------------------------------------------------------------------------
-- The policy is `using (horse_in_approvable_show(id)) with check (true)`, so
-- staff holding canApproveDocuments could rewrite any column, including
-- rider_id (moving the horse to another rider). Staff only ever write
-- document_uploads (shows/data/horses-mutations.ts). The owning rider
-- (horses_owner_all) and trusted callers are unaffected. Comparing the whole
-- row minus document_uploads means a column added later is protected too.
create or replace function public.assert_horses_non_owner_document_only()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() or old.rider_id = auth.uid() then
    return new;
  end if;

  if (to_jsonb(new) - 'document_uploads') is distinct from (to_jsonb(old) - 'document_uploads') then
    raise exception 'Only the rider can change this horse''s details; staff can only review its documents.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists horses_non_owner_document_only on public.horses;
create trigger horses_non_owner_document_only
  before update on public.horses
  for each row execute function public.assert_horses_non_owner_document_only();

-- ---------------------------------------------------------------------------
-- Low — merch_sales insert needs canEditShow
-- ---------------------------------------------------------------------------
-- Was can_view_show(show_id): any participant (a Judge, a Vendor) could write
-- sales rows that feed the show's money totals. No src path inserts here
-- today; canEditShow is the show-setup key (merch_items lives on shows).
drop policy if exists merch_sales_insert on public.merch_sales;
create policy merch_sales_insert on public.merch_sales
  for insert with check (public.has_show_permission(show_id, 'canEditShow'));

-- ---------------------------------------------------------------------------
-- Low — venues directory is organizer-side only
-- ---------------------------------------------------------------------------
-- 20260924120000 opened venues_select to any row in public.users, which
-- includes Vendors, Judges, Scribes, Announcers and ShowStaff. Every user-
-- client venue read in src is an organizer screen (show setup, venue
-- library, stable chart). The rider checkout reads a venue address through
-- the admin client, so riders were never relying on this. A per-show Show
-- Admin whose platform_role is something else (multi-role identity) is still
-- admitted through their staff_assignments row.
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
            or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
      );
$$;

drop policy if exists venues_select on public.venues;
create policy venues_select on public.venues
  for select using (public.can_access_org(org_id) or public.can_browse_venue_directory());

-- ---------------------------------------------------------------------------
-- Low — waiver document must live in the show's own folder
-- ---------------------------------------------------------------------------
-- createWaiverDocumentUploadUrl (shows/data/mutations.ts) always uploads to
-- `${showId}/waiver-<uuid>-<name>` in the `documents` bucket, but
-- registerWaiverDocument accepts any client-supplied path, so a show could be
-- pointed at another show's (or org's) file. NOT VALID: existing rows are not
-- re-checked, new writes are.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'shows_waiver_document_path_in_show_folder'
      and conrelid = 'public.shows'::regclass
  ) then
    alter table public.shows
      add constraint shows_waiver_document_path_in_show_folder check (
        waiver_document_path is null
        or (
          starts_with(waiver_document_path, id::text || '/')
          and position('..' in waiver_document_path) = 0
        )
      ) not valid;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Low — missing indexes
-- ---------------------------------------------------------------------------
-- staff_assignments: has_staff_assignment / has_show_permission match on
-- lower(email) without a show_id prefix when resolving "my shows"; the
-- existing unique index leads with show_id.
create index if not exists staff_assignments_lower_email_idx
  on public.staff_assignments (lower(email));

-- vendor_bookings: vendor_bookings_select_own / update_own and the vendor
-- dashboard match on lower(contact).
create index if not exists vendor_bookings_lower_contact_idx
  on public.vendor_bookings (lower(contact));

create index if not exists class_entries_horse_id_idx
  on public.class_entries (horse_id);

-- The PK is (org_id, user_id); can_access_org and listMemberOrgs look up by
-- user_id alone.
create index if not exists organization_owners_user_id_idx
  on public.organization_owners (user_id);

-- ---------------------------------------------------------------------------
-- H25 — a signed scoresheet's marks are locked until it is reopened
-- ---------------------------------------------------------------------------
-- The app rejects edits to a submitted sheet, but merge_score_json (security
-- invoker) and direct PostgREST writes could still change marks underneath a
-- signature. While the old row is submitted, only the submitted/signature
-- columns may change (that is the reopen path); everything a judge marks is
-- frozen. Trusted callers (admin client resets) are not limited.
create or replace function public.assert_signed_score_locked()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() then
    return new;
  end if;

  -- Reopening a signed sheet is a management action: it must clear the
  -- signature at the same time and needs canEditShow (reopenScoresheet).
  if coalesce(old.submitted, false) and not coalesce(new.submitted, false) then
    if new.signed_by is not null or new.signed_at is not null then
      raise exception 'Reopening a scoresheet must clear its signature.' using errcode = '42501';
    end if;
    if not public.has_show_permission(
      (select c.show_id from public.classes c where c.id = new.class_id), 'canEditShow'
    ) then
      raise exception 'Only show management can reopen a signed scoresheet.' using errcode = '42501';
    end if;
  end if;

  if coalesce(old.submitted, false)
     and coalesce(new.submitted, false)
     and (
       new.movements is distinct from old.movements
       or new.collectives is distinct from old.collectives
       or new.errors is distinct from old.errors
       or new.error_at is distinct from old.error_at
       or new.remarks is distinct from old.remarks
       or new.final_remarks is distinct from old.final_remarks
     ) then
    raise exception 'This scoresheet is signed. Reopen it before changing marks.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists scores_signed_locked on public.scores;
create trigger scores_signed_locked
  before update on public.scores
  for each row execute function public.assert_signed_score_locked();

-- ---------------------------------------------------------------------------
-- C5 follow-up — scorers may move the ride pointer
-- ---------------------------------------------------------------------------
-- The ride-in-ring pointer (classes.scoring_pos) fell through to the
-- canEditShow branch, so a judge's own advance was refused. Same body as
-- 20260921140000 plus one branch: a change to scoring_pos alone needs
-- canEnterScores.
create or replace function public.assert_classes_write_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_j jsonb := to_jsonb(old);
  new_j jsonb := to_jsonb(new);
begin
  -- The admin client (service role) has already done its own checks.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if (old_j - 'scoring_open') = (new_j - 'scoring_open') then
    if not public.can_view_show(new.show_id) then
      raise exception 'not authorized to change scoring status for this class';
    end if;
    return new;
  end if;

  if (old_j - 'scoring_pos') = (new_j - 'scoring_pos') then
    if not public.has_show_permission(new.show_id, 'canEnterScores') then
      raise exception 'not authorized to move the ride in the ring for this class';
    end if;
    return new;
  end if;

  if (old_j - 'working_in_entry_id') = (new_j - 'working_in_entry_id') then
    if not public.has_show_permission(new.show_id, 'canManageHoldingQueue') then
      raise exception 'not authorized to manage the holding queue for this class';
    end if;
    return new;
  end if;

  if (old_j - 'results_published' - 'results_published_at')
     = (new_j - 'results_published' - 'results_published_at') then
    if not public.has_show_permission(new.show_id, 'canPublishShow') then
      raise exception 'not authorized to publish results for this class';
    end if;
    return new;
  end if;

  if (old_j - 'ring_packet_printed_at') = (new_j - 'ring_packet_printed_at') then
    if not public.has_show_permission(new.show_id, 'canManageEntryLedger') then
      raise exception 'not authorized to record a ring packet print for this class';
    end if;
    return new;
  end if;

  if not public.has_show_permission(new.show_id, 'canEditShow') then
    raise exception 'not authorized to edit this class';
  end if;
  return new;
end;
$$;
