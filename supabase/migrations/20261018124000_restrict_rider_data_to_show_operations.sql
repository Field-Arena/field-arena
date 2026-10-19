-- Riders' personal data is for show operations, not every staff seat.
-- Re-runnable.
--
-- Stress test 2026-10-17 (#12): a Vendor on a show could read every entered
-- rider's email, phone, home address, date of birth, emergency contact and
-- USEF/FEI numbers, and every horse's document records (Coggins, vet
-- papers). riders_select_by_show_staff, horses_select_by_show_staff, the
-- horse-documents storage policy and entry_membership_checks_select all
-- used can_view_show(), which is true for ANY staff assignment on the show:
-- Vendor, Announcer, Judge, Scribe and ShowStaff alike.
--
-- Who actually reads these rows (src/):
--   Organizer / Show Admin   Horses, Entry Ledger, membership checks,
--                            awards, results, stable chart, sales, users.
--   ShowStaff                Operations pages, incl. the read-only Horses
--                            page (documents and rider contact) and Find.
--   Rider                    their own rows (riders_select_self,
--                            horses_owner_all, own documents) — unchanged.
--   Judge / Scribe,          nothing: scoring, judging, announcer and
--   Announcer, Vendor        vendor pages read class_entries' rider/horse
--                            names, never riders or horses.
--
-- can_view_rider_data() admits show management (can_manage_show: SuperAdmin,
-- the org's Organizer/owners, Show Admin), ShowStaff, and anyone granted
-- canApproveDocuments, canManageEntryLedger or canEditShow on the show.
-- Vendor, Announcer, Judge and Scribe seats no longer see riders' personal
-- data, horse document records or documents, or membership numbers.

create or replace function public.can_view_rider_data(target_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_manage_show(target_show_id)
      or (
        public.show_org_is_active(target_show_id)
        and public.has_staff_assignment(target_show_id, array['ShowStaff'])
      )
      or public.has_show_permission(target_show_id, 'canApproveDocuments')
      or public.has_show_permission(target_show_id, 'canManageEntryLedger')
      or public.has_show_permission(target_show_id, 'canEditShow');
$$;

revoke execute on function public.can_view_rider_data(uuid) from public, anon;
grant execute on function public.can_view_rider_data(uuid) to authenticated, service_role;

create or replace function public.rider_in_rider_data_show(target_rider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.rider_id = target_rider_id
      and public.can_view_rider_data(c.show_id)
  );
$$;

create or replace function public.horse_in_rider_data_show(target_horse_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where ce.horse_id = target_horse_id
      and public.can_view_rider_data(c.show_id)
  );
$$;

revoke execute on function public.rider_in_rider_data_show(uuid) from public, anon;
revoke execute on function public.horse_in_rider_data_show(uuid) from public, anon;
grant execute on function public.rider_in_rider_data_show(uuid) to authenticated, service_role;
grant execute on function public.horse_in_rider_data_show(uuid) to authenticated, service_role;

drop policy if exists riders_select_by_show_staff on public.riders;
create policy riders_select_by_show_staff on public.riders
  for select using (public.is_super_admin() or public.rider_in_rider_data_show(id));

drop policy if exists horses_select_by_show_staff on public.horses;
create policy horses_select_by_show_staff on public.horses
  for select using (public.horse_in_rider_data_show(id));

drop policy if exists entry_membership_checks_select on public.entry_membership_checks;
create policy entry_membership_checks_select on public.entry_membership_checks
  for select using (public.can_view_rider_data(show_id));

drop policy if exists "fa_horse_docs_staff_read" on storage.objects;
create policy "fa_horse_docs_staff_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'horse-documents'
    and public.horse_in_rider_data_show(public.safe_uuid((storage.foldername(name))[2]))
  );
