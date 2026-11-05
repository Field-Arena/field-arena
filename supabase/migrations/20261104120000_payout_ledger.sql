-- Weekly-payout ledger, phase A (no money moves in this migration).
--
-- Field & Arena is the merchant of record: riders and vendors pay the
-- platform, and the platform settles with each organizer on a weekly
-- statement. That statement is built from DATED money events, because the
-- running totals already on orders / vendor_bookings (amount_total,
-- refunded_amount, additional_charges_total) cannot say which week a refund
-- or an extra charge happened in.
--
-- sale_events is that dated record. Only real Stripe money gets a row: the
-- stripe_ref (payment intent, refund or dispute id) is required, and the
-- unique (kind, stripe_ref) makes every write idempotent, so a webhook retry
-- or the success-page and the webhook both firing cannot double count.

-- How each sale's money is handled. Everything sold before this change was
-- charged as a destination charge (the organizer was paid at checkout), so
-- existing rows default to 'destination' and are never settled again.
-- New checkouts write 'platform' explicitly.
alter table public.orders
  add column if not exists settlement text not null default 'destination'
  check (settlement in ('destination', 'platform'));

alter table public.vendor_bookings
  add column if not exists settlement text not null default 'destination'
  check (settlement in ('destination', 'platform'));

comment on column public.orders.settlement is
  'destination = organizer was paid at checkout (legacy); platform = F&A holds the money and settles weekly.';
comment on column public.vendor_bookings.settlement is
  'destination = organizer was paid at checkout (legacy); platform = F&A holds the money and settles weekly.';

create table if not exists public.sale_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete restrict,
  show_id uuid not null references public.shows (id) on delete restrict,
  sale_type text not null check (sale_type in ('order', 'vendor_booking')),
  sale_id uuid not null,
  kind text not null check (
    kind in ('payment', 'additional_charge', 'refund', 'dispute', 'dispute_reversal')
  ),
  -- Always positive; the kind decides the direction.
  amount numeric(12, 2) not null check (amount >= 0),
  -- Platform fee included in `amount` (only meaningful on payments).
  fee numeric(12, 2) not null default 0 check (fee >= 0),
  stripe_ref text not null check (stripe_ref <> '' and stripe_ref not like 'pi\_demo\_%'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (kind, stripe_ref)
);

create index if not exists sale_events_org_time_idx
  on public.sale_events (org_id, occurred_at);
create index if not exists sale_events_sale_idx
  on public.sale_events (sale_type, sale_id);

comment on table public.sale_events is
  'Dated money events (payments, extra charges, refunds, chargebacks) for weekly organizer settlement. Real Stripe money only; written by server code with the service role.';

alter table public.sale_events enable row level security;

-- Organizer- and show-admin-facing reads go through server code that checks
-- the money permission first; direct client reads are SuperAdmin only.
create policy sale_events_super_admin_all on public.sale_events
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
