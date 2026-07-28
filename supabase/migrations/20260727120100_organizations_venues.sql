-- Organizations and venues — the root of the ownership tree.
--
-- Legacy source: `organizations` and `venues` in api/_lib/schema.js.
-- Every money column becomes numeric(12,2) rather than bare numeric: the
-- legacy schema stored these as unconstrained numeric and relied on the
-- application to round, which meant fee arithmetic could drift in the third
-- decimal place before it ever reached Stripe.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  region text,
  country text,

  -- Launch is US-only, but every row carries a real currency/locale/timezone
  -- so expanding countries is a data change, not a migration.
  currency text default 'USD',
  locale text,
  timezone text,
  avg_entry_value numeric(12, 2),

  -- Payments stay on Stripe (the one non-Supabase service we keep). Connect
  -- onboarding *completeness* is intentionally not cached — it is checked live
  -- against Stripe each time, so there is no stale-status failure mode.
  stripe_connect_account_id text,
  payout_cadence text default 'weekly' check (payout_cadence in ('daily', 'weekly')),
  holdback_percent numeric(5, 2), -- null = no holdback

  -- Which platform-fee formula applies: 'default' ($7.99 floor, else 8%) or
  -- 'gmo' (flat 18%, no floor — smaller USDF Group Member Organization club
  -- shows). Add-ons/qualifications/vendor fees always use the flat 8% path
  -- regardless of this column.
  fee_model text not null default 'default' check (fee_model in ('default', 'gmo')),

  email text,
  website text,
  phone text,

  -- Suspended orgs' shows become invisible to riders (same 404-style response
  -- as an unpublished show). No reason field, no audit trail — just the flag.
  suspended boolean not null default false,

  -- Soft delete. The org row and every child row stay intact; nothing
  -- cascades. A non-null value means "hidden from the active-org list, and its
  -- shows/purchases are treated as gone".
  deleted_at timestamptz,

  -- Marks seeded example orgs so real customers never see them, without having
  -- to delete the example shows/add-ons/vendor items they carry.
  is_demo boolean not null default false,

  created_at timestamptz not null default now()
);

comment on table public.organizations is
  'Show organizers. Root of the ownership tree — venues, shows and staff all hang off an org.';

-- The active-org list is the single most-read query in the organizer console;
-- it always filters on both of these.
create index organizations_active_idx
  on public.organizations (suspended, is_demo)
  where deleted_at is null;

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  city text,
  region text,
  country text,

  -- A reusable location library, separate from any one show: address and
  -- contact details an organizer types once and reuses per show.
  address text,
  website text,
  phone text,
  contact text,

  -- Ring/arena layout: [{name, size}]. Same shape a show stores per-show, kept
  -- here so any show at this venue can adopt it instead of rebuilding it.
  rings jsonb default '[]'::jsonb,

  -- Stable layout — structure only: [{name, stallCount, rowCount}]. Per-show
  -- stall assignments (horse/rider/shavings) are inherently per-show and live
  -- on shows.stable_chart instead.
  stables jsonb default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index venues_org_id_idx on public.venues (org_id);
