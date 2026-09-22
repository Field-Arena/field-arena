create table public.class_order_checks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null unique references public.classes (id) on delete cascade,
  checked_at timestamptz not null default now(),
  checked_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);
create index class_order_checks_class_idx on public.class_order_checks (class_id);

alter table public.class_order_checks enable row level security;

create policy class_order_checks_select on public.class_order_checks
  for select using (public.can_view_show(public.class_show_id(class_id)));

create policy class_order_checks_write on public.class_order_checks
  for all
  using (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canEnterScores'));

-- Same two-layer shape as assert_scores_seat_ownership (20260907160000):
-- broad RLS (canEnterScores, which Judge and Scribe both hold by default)
-- is not enough on its own -- that migration's own history is exactly why
-- (a prior trigger let a scribe write to a seat that wasn't theirs). This
-- checks "is the caller ANY scribe seated on this class's panel" rather
-- than one seat_id, since order-checked is a class-level action, not
-- per-seat.
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
      and (sa.user_id = auth.uid()
           or sa.email = (select email from public.users where id = auth.uid()))
  ) then
    raise exception 'You are not assigned as a scribe on this class.';
  end if;

  return new;
end;
$$;

create trigger class_order_checks_scribe_seat_check
  before insert or update on public.class_order_checks
  for each row execute function public.assert_order_check_scribe_seat();
