-- RLS for the filing cabinet tables.
alter table public.show_horses enable row level security;
alter table public.show_entries enable row level security;
alter table public.entry_issues enable row level security;
alter table public.entry_membership_checks enable row level security;

create policy show_horses_select on public.show_horses for select using (public.can_view_show(show_id));
create policy show_horses_write on public.show_horses for all
  using (public.has_show_permission(show_id, 'canManageEntryLedger'))
  with check (public.has_show_permission(show_id, 'canManageEntryLedger'));

create policy show_entries_select_staff on public.show_entries for select using (public.can_view_show(show_id));
create policy show_entries_select_owner on public.show_entries for select using (rider_id = auth.uid());
create policy show_entries_write on public.show_entries for all
  using (public.has_show_permission(show_id, 'canManageEntryLedger'))
  with check (public.has_show_permission(show_id, 'canManageEntryLedger'));

create policy entry_issues_select on public.entry_issues for select using (public.can_view_show(show_id));
create policy entry_issues_write on public.entry_issues for all
  using (public.has_show_permission(show_id, 'canManageEntryLedger'))
  with check (public.has_show_permission(show_id, 'canManageEntryLedger'));

create policy entry_membership_checks_select on public.entry_membership_checks for select using (public.can_view_show(show_id));
create policy entry_membership_checks_write on public.entry_membership_checks for all
  using (public.has_show_permission(show_id, 'canManageEntryLedger'))
  with check (public.has_show_permission(show_id, 'canManageEntryLedger'));
