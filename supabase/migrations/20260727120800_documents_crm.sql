-- Documents, walk-up merch sales, and the sales CRM.
--
-- Legacy source: `documents`, `catalog_documents`, `merch_sales`, `leads`.
--
-- File storage moves from Vercel Blob to Supabase Storage. The legacy schema
-- kept blob_url alongside blob_pathname so a delete could remove the underlying
-- object and not just the row; the same reasoning applies to Storage, so each
-- table keeps an object `path` (what you pass to storage.from().remove()) and,
-- where the file is served publicly, a resolved `url`.

-- ---------------------------------------------------------------------------
-- Per-show document library
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,

  path text not null, -- Supabase Storage object path
  url text,           -- resolved public URL, null for private buckets

  -- Which classes/events this document is attached to.
  event_ids jsonb default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index documents_show_id_idx on public.documents (show_id);

-- ---------------------------------------------------------------------------
-- Platform-level document library
-- ---------------------------------------------------------------------------
-- Distinct from `documents` above, which is strictly per-show. These files are
-- not tied to any show — e.g. the reference "Tests" folder. Deliberately no FK
-- to scoring_catalog: a catalog entry may or may not have a source PDF, and a
-- PDF may be uploaded before anyone builds the catalog entry for it.
create table public.catalog_documents (
  id uuid primary key default gen_random_uuid(),
  folder text not null default 'Tests',
  name text not null,

  path text not null,
  url text,

  created_at timestamptz not null default now()
);

create index catalog_documents_folder_idx on public.catalog_documents (folder);

-- ---------------------------------------------------------------------------
-- Walk-up merchandise sales
-- ---------------------------------------------------------------------------
-- Rung up by show staff at the show itself, distinct from a rider's own
-- checkout (public.orders): no rider and no card involved, just a staff member
-- recording a sale against the show's merch_items catalog. This was an
-- in-memory-only object before, lost on every reload and invisible to any other
-- staff device.
create table public.merch_sales (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,

  -- [{merchItemId, name, qty, unitPrice, amount}]
  items jsonb not null,
  total numeric(12, 2) not null,

  created_at timestamptz not null default now()
);

create index merch_sales_show_id_idx on public.merch_sales (show_id);

-- ---------------------------------------------------------------------------
-- Sales CRM
-- ---------------------------------------------------------------------------
-- One row per organization being sold to, not per person: cost_per_event,
-- avg_revenue_per_show, notes and the onboarding checklist all describe the
-- account, not an individual contact.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  shows_per_year integer,

  -- new -> demo_scheduled (a booking landed) -> demo_completed (marked after
  -- the call) -> onboarding -> customer (a real org row exists) -> lost.
  status text default 'new'
    check (status in (
      'new', 'demo_scheduled', 'demo_completed', 'onboarding', 'customer', 'lost'
    )),

  cost_per_event numeric(12, 2),
  avg_revenue_per_show numeric(12, 2),
  notes text,

  -- The scheduling provider's own event URI. Lets a retried webhook update in
  -- place instead of creating a duplicate lead, and is a real audit trail back
  -- to the source booking.
  calendly_event_uri text unique,

  demo_at timestamptz,
  onboarding_at timestamptz,

  -- [{id, label, done}] — seeded with the real onboarding checklist when the
  -- onboarding email is first sent, then editable per lead (a given org might
  -- not need every item).
  onboarding_checklist jsonb default '[]'::jsonb,
  onboarding_email_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on public.leads (status);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
