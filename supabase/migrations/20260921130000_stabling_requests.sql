-- Stabling relationship captured at purchase time. Trainer/barn name, a
-- "stable with" request, and notes are collected pre-payment at checkout
-- and held on orders.stabling_request (ephemeral jsonb, mirrors how
-- orders.items already holds pre-payment cart data). They are only
-- materialized into stabling_requests inside finalizeClaimedOrder
-- (checkout.ts), alongside class_entries, guarded by the same
-- claim-then-fulfill check — so a row here only ever exists for a PAID
-- order, same guarantee class_entries already gives.

alter table public.orders add column stabling_request jsonb;
-- Deliberately NOT added to the column grant list in
-- 20260907120000_fix_money_column_privileges.sql — this is an internal
-- staging field, read only by the admin client inside finalizeClaimedOrder.
-- Client code reads the materialized stabling_requests row instead.

create table public.stabling_requests (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  rider_id uuid not null references public.riders (id) on delete cascade,

  trainer_name text not null,
  horse_stalls integer not null default 0,
  tack_stalls integer not null default 0,
  stable_with text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (order_id)
);

create index stabling_requests_show_id_idx on public.stabling_requests (show_id);
create index stabling_requests_trainer_name_idx
  on public.stabling_requests (show_id, lower(trainer_name));

create trigger stabling_requests_set_updated_at
  before update on public.stabling_requests
  for each row execute function public.set_updated_at();

alter table public.stabling_requests enable row level security;

-- Rider reads their own; any staff who can view the show can read it too —
-- this is operational data for building the stable chart, not financial
-- data, so it follows the class_entries_select precedent (can_view_show),
-- not the orders precedent (canViewMoney).
create policy stabling_requests_select_owner on public.stabling_requests
  for select using (rider_id = auth.uid());
create policy stabling_requests_select_staff on public.stabling_requests
  for select using (public.can_view_show(show_id));

-- No insert/delete policy: the only write path is the admin client inside
-- finalizeClaimedOrder, exactly like orders/class_entries already work.
-- Organizer typo-fixes post-purchase are the one client-initiated write:
create policy stabling_requests_update_staff on public.stabling_requests
  for update
  using (public.has_show_permission(show_id, 'canEditShow'))
  with check (public.has_show_permission(show_id, 'canEditShow'));
