-- Vendors: the show's booth/space catalog, bookings, and booking line items.
--
-- Legacy source: `vendor_items`, `vendor_bookings`, `vendor_booking_items`.
--
-- A vendor is a platform-wide concept but a *booking* always ties a vendor to
-- one show, never to an organizer. That distinction is why there is no
-- vendor_id -> organizations FK anywhere in this file.

-- ---------------------------------------------------------------------------
-- Bookable items (booth sizes, electric hookup, extra table, ...)
-- ---------------------------------------------------------------------------
-- Same shape as add_ons on purpose, different concept: add_ons are things a
-- RIDER buys, these are things a VENDOR reserves.
create table public.vendor_items (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,
  price numeric(12, 2) default 0,
  enabled boolean default true,
  qty integer -- null = unlimited
);

create index vendor_items_show_id_idx on public.vendor_items (show_id);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
-- A booking doubles as this vendor's "order": there is no rider-scoped orders
-- row a vendor booking could attach to instead, so the payment columns mirror
-- public.orders exactly rather than being factored into a shared table.
create table public.vendor_bookings (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,

  -- `name` is the business/farm name as it should appear in the programme;
  -- contact_name is the actual person. Two separate fields on real paper vendor
  -- application forms, so two separate columns here.
  name text not null,
  contact text,
  contact_name text,
  phone text,
  website text,
  products_offered text,
  special_requests text,

  status text default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid')),

  created_at timestamptz not null default now(),

  -- Payment record. Captured once at checkout-confirm time rather than
  -- recomputed live from vendor_booking_items x vendor_items.price: catalog
  -- prices can change after a booking is paid, and a refund cap must be based
  -- on what was actually charged, not today's price.
  stripe_payment_intent_id text,
  paid_at timestamptz,
  amount_total numeric(12, 2),
  fee_total numeric(12, 2) default 0,

  -- Never includes any part of fee_total. The platform fee is not refundable
  -- and there is no organizer override.
  refunded_amount numeric(12, 2) default 0,

  -- Lets the organizer charge the same card again later without the vendor
  -- re-entering it. Null until the first successful payment.
  stripe_customer_id text,
  stripe_payment_method_id text,

  -- Kept separate from amount_total so amount_total stays "what checkout
  -- actually priced" and the refund cap is untouched by later additional
  -- charges, which are their own PaymentIntents with their own fee handling.
  additional_charges_total numeric(12, 2) default 0,
  additional_charges jsonb default '[]'::jsonb, -- [{id, amount, createdAt}]

  -- One entry per this show's vendor_document_requirements item this vendor has
  -- a file for: [{requirementId, label, path, expirationDate, verified}].
  document_uploads jsonb default '[]'::jsonb,

  -- The vendor equivalent of a rider waiver, kept inline rather than in a
  -- separate table: a booking is already a 1:1 "this vendor, this show" record
  -- with no multi-show identity to share signatures across, unlike riders.
  -- agreement_signed_text is a snapshot of exactly what was signed, so if the
  -- organizer edits the agreement afterwards the mismatch stays visible.
  agreement_signed_at timestamptz,
  agreement_signed_text text,
  agreement_signed_name text,

  -- Refunds must never exceed what was charged net of the platform fee.
  constraint vendor_bookings_refund_within_cap check (
    amount_total is null
    or refunded_amount <= amount_total - coalesce(fee_total, 0)
  )
);

create index vendor_bookings_show_id_idx on public.vendor_bookings (show_id);
create index vendor_bookings_status_idx on public.vendor_bookings (show_id, status);

-- ---------------------------------------------------------------------------
-- Booking line items
-- ---------------------------------------------------------------------------
-- Replaces a legacy `items: {[vendorItemName]: qty}` object map with real rows,
-- so a renamed vendor item no longer orphans every booking that referenced it.
create table public.vendor_booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.vendor_bookings (id) on delete cascade,
  vendor_item_id uuid not null references public.vendor_items (id) on delete restrict,
  qty integer default 1 check (qty > 0),

  unique (booking_id, vendor_item_id)
);

create index vendor_booking_items_booking_id_idx on public.vendor_booking_items (booking_id);
