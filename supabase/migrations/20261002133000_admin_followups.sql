-- Admin follow-ups to 20261002120000_audit_security_fixes.sql.
-- NOT applied anywhere yet — run on dev first.
--
-- ---------------------------------------------------------------------------
-- Suspended / deleted organizations lose access (audit Medium)
-- ---------------------------------------------------------------------------
-- Suspending (organizations.suspended) or soft-deleting (deleted_at) an org
-- used to be cosmetic: its Organizer, co-owners and staff kept full access
-- through RLS. Every org/show access helper now also requires the org to be
-- active. SuperAdmin short-circuits before that check, and the SuperAdmin
-- reinstate / delete flows write through the admin client (service role,
-- bypasses RLS), so they keep working.
--
-- The dashboard detects the blocked state with the admin client
-- (staff/data/org-access-queries.ts), because once this applies the org row
-- is no longer visible to its own staff.
--
-- can_view_show composes can_manage_show + has_staff_assignment, and
-- can_access_show_org calls can_access_org, so both inherit the check.

create or replace function public.org_is_active(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = target_org_id
      and not coalesce(o.suspended, false)
      and o.deleted_at is null
  );
$$;

create or replace function public.show_org_is_active(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.shows s
    join public.organizations o on o.id = s.org_id
    where s.id = target_show_id
      and not coalesce(o.suspended, false)
      and o.deleted_at is null
  );
$$;

revoke all on function public.org_is_active(uuid) from public, anon;
revoke all on function public.show_org_is_active(uuid) from public, anon;
grant execute on function public.org_is_active(uuid) to authenticated;
grant execute on function public.show_org_is_active(uuid) to authenticated;

-- Supersedes 20260907170000_organization_owners.sql.
create or replace function public.can_access_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin()
      or (
        public.org_is_active(target_org_id)
        and (
          exists (
            select 1 from public.users
            where id = auth.uid()
              and platform_role = 'Organizer'
              and org_id = target_org_id
          )
          or exists (
            select 1 from public.organization_owners
            where org_id = target_org_id
              and user_id = auth.uid()
          )
        )
      );
$$;

-- Supersedes 20260727120900_rls.sql.
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
           or lower(sa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         )
         and (allowed_roles is null or sa.role = any (allowed_roles))
     );
$$;

-- Supersedes 20260907170000_organization_owners.sql.
create or replace function public.can_manage_show(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin()
      or (
        public.show_org_is_active(target_show_id)
        and (
          exists (
            select 1
            from public.shows s
            join public.users u on u.id = auth.uid()
            where s.id = target_show_id
              and u.platform_role = 'Organizer'
              and u.org_id = s.org_id
          )
          or exists (
            select 1
            from public.shows s
            join public.organization_owners oo on oo.org_id = s.org_id
            where s.id = target_show_id
              and oo.user_id = auth.uid()
          )
          or public.has_staff_assignment(target_show_id, array['Show Admin'])
        )
      );
$$;

-- Supersedes 20260915140000_filing_cabinet_permission.sql. Identical body
-- (every permission key carried forward unchanged) plus the active-org check
-- right after the SuperAdmin short-circuit.
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
