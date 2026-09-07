-- Client feedback: "does not allow more than 1 organization used at a time."
-- An Organizer's home org is a single FK (users.org_id) — someone who runs
-- two separate show-organizing businesses needs two logins today, one per
-- org, because there was no way to grant a second org's ownership without
-- replacing that column.
--
-- The fix leans on plumbing that already exists rather than rewriting it:
--
-- 1. The org switcher (staff/data/org-selection.ts, listMemberOrgs) already
--    aggregates every org a user has access to from more than one source
--    (their own org_id, plus any org whose show they hold a staff_assignment
--    on) and already lets them switch between them via a cookie that every
--    organizer-facing page reads through getOrganizerContext(). It just never
--    had a source for "owns a second org" to draw from.
-- 2. Every RLS policy that gates Organizer-level writes (organizations,
--    venues, shows insert/delete, and anything else scoped to "this org")
--    already funnels through one function, public.can_access_org(org_id) —
--    17 policies call it. Extending that one function, rather than editing
--    each policy, is what makes this a small, low-risk change instead of a
--    schema-wide rewrite.
--
-- organization_owners is additive: nothing about a user's *primary* org
-- (users.org_id) changes, and every existing single-org user has zero rows
-- here, so can_access_org's behaviour for them is unchanged (the added OR
-- clause's EXISTS is simply never true). It only takes effect once someone
-- is explicitly granted a second org.

create table public.organization_owners (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

comment on table public.organization_owners is
  'Additional organizations an Organizer owns beyond their primary users.org_id. Granted by SuperAdmin only — see addOrganizationOwner in superadmin/data/mutations.ts.';

alter table public.organization_owners enable row level security;

-- Only SuperAdmin manages grants — this is a platform-level decision, not
-- something an Organizer can do for themselves (that would let anyone
-- self-grant access to any organization's data).
create policy organization_owners_superadmin_all on public.organization_owners
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- A user needs to be able to read their own grants — this is exactly what
-- listMemberOrgs() queries to build the org switcher.
create policy organization_owners_select_own on public.organization_owners
  for select using (user_id = auth.uid());

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
      )
      or exists (
        select 1 from public.organization_owners
        where org_id = target_org_id
          and user_id = auth.uid()
      );
$$;

-- can_manage_show and has_show_permission each carry their own inline copy of
-- the same "is this an Organizer on this show's org" check rather than
-- calling can_access_org(s.org_id) — both predate this table and both need
-- the same additional-owner clause, or a co-owner could see/switch into
-- their second org (via can_access_org) but not actually run a show in it.
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
      or exists (
        select 1
        from public.shows s
        join public.organization_owners oo on oo.org_id = s.org_id
        where s.id = target_show_id
          and oo.user_id = auth.uid()
      )
      or public.has_staff_assignment(target_show_id, array['Show Admin']);
$$;

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
