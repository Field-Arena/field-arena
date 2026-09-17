-- Announcer -> ring coverage for a show. Legacy kept this as in-memory
-- client state (ringAssignments[showId][ringName] = staffEmail) with nothing
-- persisted server-side; this is the first real, durable version of it.
--
-- "Rings" themselves are not a stored list anywhere -- classes.location/
-- classes.arena are free text per class, and the Announcer live view
-- (src/modules/announcements/data/queries.ts) already treats
-- `location ?? arena` as the ring name. This table follows that same
-- convention: a ring_name here is exactly one of those distinct values for
-- the show, looked up at read time, not a separate managed list.
create table public.ring_assignments (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  ring_name text not null,
  staff_assignment_id uuid references public.staff_assignments (id) on delete set null,
  updated_at timestamptz not null default now(),

  unique (show_id, ring_name)
);

create index ring_assignments_show_id_idx on public.ring_assignments (show_id);

alter table public.ring_assignments enable row level security;

create policy ring_assignments_select on public.ring_assignments
  for select using (public.can_view_show(show_id));

create policy ring_assignments_write on public.ring_assignments
  for all
  using (public.has_show_permission(show_id, 'canManageStaff'))
  with check (public.has_show_permission(show_id, 'canManageStaff'));
