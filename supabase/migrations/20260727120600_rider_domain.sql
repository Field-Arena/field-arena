-- Rider-owned data: horses, waiver signatures, and orders.
--
-- Legacy source: `horses`, `waiver_signatures`, `orders`.

-- ---------------------------------------------------------------------------
-- Horses
-- ---------------------------------------------------------------------------
-- A horse's registered name is permanent once added (a real governing-body
-- rule, and the pre-existing UX rule); everything else stays editable. That is
-- enforced by a trigger rather than left to the application, because there are
-- several write paths.
create table public.horses (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete cascade,
  name text not null,

  stable text,
  trainer text,
  trainer_phone text,

  -- Generic per-requirement document uploads: one entry per the show's
  -- document_requirements item this horse has a file for:
  -- [{requirementId, label, path, expirationDate, verified}].
  --
  -- The legacy schema had fixed coggins_*/vac_* columns and a comment noting
  -- they were superseded but retained for back-compat with already-uploaded
  -- rows. This is a fresh database with no such rows, so only the generic shape
  -- survives the port.
  document_uploads jsonb default '[]'::jsonb,

  -- Stabling/scheduling relevance (stallions often need to be stalled apart),
  -- not a scoring or eligibility field.
  is_stallion boolean default false,

  created_at timestamptz not null default now()
);

create index horses_rider_id_idx on public.horses (rider_id);

create or replace function public.assert_horse_name_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.name is distinct from old.name then
    raise exception 'a horse''s registered name cannot be changed once set (was %, got %)', old.name, new.name;
  end if;
  return new;
end;
$$;

create trigger horses_name_immutable
  before update on public.horses
  for each row execute function public.assert_horse_name_immutable();

-- ---------------------------------------------------------------------------
-- Waiver signatures
-- ---------------------------------------------------------------------------
-- One signature covers every horse and entry a rider has in a given show: the
-- released party is that show's organizer specifically, so a waiver is signed
-- once per show — not once ever, and not once per horse.
create table public.waiver_signatures (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  full_name text not null,
  signed_at timestamptz not null default now(),

  -- Distinct from signed_at on purpose: signed_at is server truth of when the
  -- row was written, signature_date is what the rider typed as the date they
  -- are dating the document. On a paper waiver those genuinely differ.
  signature_date text,

  unique (rider_id, show_id)
);

create index waiver_signatures_show_id_idx on public.waiver_signatures (show_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
-- One row per rider checkout, real money behind it. Line items stay jsonb: a
-- receipt's items are read as a unit and never queried across orders, so a real
-- order_items table would be premature normalization.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete restrict,
  show_id uuid not null references public.shows (id) on delete restrict,

  stripe_payment_intent_id text,
  amount_total numeric(12, 2) not null,

  status text default 'pending'
    check (status in ('pending', 'paid', 'failed', 'abandoned')),

  -- [{kind, label, qty, unitPrice, amount, classId?, horseId?, refId?}]
  items jsonb default '[]'::jsonb,

  -- The platform-fee portion of amount_total, computed once at order creation
  -- and never recomputed. This is what a refund may never include:
  --   amount_total - fee_total - refunded_amount = still refundable.
  fee_total numeric(12, 2) default 0,

  -- Cumulative net-of-fee amount actually refunded so far.
  refunded_amount numeric(12, 2) default 0,

  created_at timestamptz not null default now(),
  paid_at timestamptz,

  -- Rider-reported stabling logistics, settable only once the order is paid.
  arrival_date text,
  departure_date text,

  -- Captured once the original PaymentIntent succeeds, so the organizer can
  -- charge the same card again later without the rider re-entering it. A rider
  -- whose card was never saved simply cannot be charged this way.
  stripe_customer_id text,
  stripe_payment_method_id text,

  -- Kept separate from amount_total so the refund cap above stays correct;
  -- additional charges are their own PaymentIntents with their own fees and are
  -- not refundable through this order's cap.
  additional_charges_total numeric(12, 2) default 0,
  additional_charges jsonb default '[]'::jsonb, -- [{id, amount, createdAt}]

  -- The refund invariant, enforced in the database rather than only in the
  -- refund handler. The legacy code checked this in application code alone; a
  -- concurrency test in that repo (tests/integration/refund-concurrency.test.js)
  -- existed precisely because two simultaneous refunds could both pass the
  -- application check and jointly exceed the cap.
  constraint orders_refund_within_cap check (
    refunded_amount <= amount_total - coalesce(fee_total, 0)
  ),
  constraint orders_refund_non_negative check (refunded_amount >= 0)
);

create index orders_rider_id_idx on public.orders (rider_id);
create index orders_show_id_idx on public.orders (show_id);
create index orders_status_idx on public.orders (show_id, status);

-- Revenue reporting sums paid orders per show constantly.
create index orders_paid_idx on public.orders (show_id, paid_at)
  where status = 'paid';

-- The stale-order cleanup job scans pending orders by age.
create index orders_pending_created_idx on public.orders (created_at)
  where status = 'pending';
