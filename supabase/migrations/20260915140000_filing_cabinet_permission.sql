-- Add canManageEntryLedger permission. This redefines has_show_permission
-- (superseding the copy in 20260907170000_organization_owners.sql, which
-- itself superseded 20260727120900_rls.sql) — the RLS-enforcing copy is
-- always the latest create-or-replace, so it must carry every existing
-- permission key forward unchanged plus the new one.
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
