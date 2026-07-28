-- Shows — the central entity. Almost every other table is show-scoped.
--
-- Legacy source: `shows` and `role_assignments` in api/_lib/schema.js.
--
-- Two legacy patterns are preserved deliberately rather than "fixed":
--
--  1. Dates are ISO 'YYYY-MM-DD' text, not `date`. The legacy views sort and
--     parse these as strings (parseYmd, localeCompare); switching to real date
--     columns would change ordering semantics in roughly ten read sites.
--  2. Several settings stay as jsonb blobs. They are read as a whole document
--     and never queried across shows, so normalising them would be premature.
--
-- One legacy pattern is *not* preserved: `logo_data_url` / `show_image_data_url`
-- stored base64 image payloads directly in text columns as an interim measure
-- before blob storage existed. Supabase Storage exists from day one here, so
-- those become storage paths like every other upload.

create table public.shows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete set null,

  name text not null,
  date_label text,
  start_date text, -- ISO 'YYYY-MM-DD'
  end_date text,   -- ISO 'YYYY-MM-DD'

  -- The health indicator shown on the platform dashboard (green/yellow/red),
  -- NOT a sale-state flag — that is `published` below.
  status text,

  -- Plural on purpose: real events run under more than one governing body and
  -- across more than one discipline.
  disciplines jsonb default '[]'::jsonb,
  governing_bodies jsonb default '[]'::jsonb,

  -- Free-text venue label from the show-builder header form, distinct from
  -- venue_id: the show builder does not manage real venue rows.
  venue_name text,

  -- Per-show ring config: [{num, name}]. Has no natural home on `venues` —
  -- those are physical facilities, this is this show's ring numbering.
  locations jsonb default '[]'::jsonb,

  -- One entry per show day, 'HH:MM'.
  day_start_times jsonb default '[]'::jsonb,
  day_end_times jsonb default '[]'::jsonb,

  -- {perMin, buffer, upper, end, order, warmup, lunch, extraBreaks, extraBreakMin}
  schedule_prefs jsonb default '{}'::jsonb,

  ticket_open text,
  ticket_close text,
  selected_template text default 'modern',

  -- Supabase Storage object paths (see file header — these were base64 text
  -- columns in the legacy schema).
  logo_path text,
  show_image_path text,

  -- Vendor booth/space layout map (PDF or image) uploaded in the vendor-spaces
  -- panel.
  vendor_map_url text,
  vendor_map_path text,

  -- Sale state. Distinct from `status` above.
  published boolean default false,
  published_at timestamptz,

  -- {org, recognition, address, website, phone, contactEmail}. These had no
  -- backing columns in the original client-only build, so anything typed into
  -- them was lost on reload.
  show_details jsonb default '{}'::jsonb,

  -- {approved, ticketClosed} — schedule-approval and ticket-sales-close, which
  -- were browser-local flags before and therefore invisible to any other
  -- session or device looking at the same show.
  runner_state jsonb default '{}'::jsonb,

  -- {classDivGroups, maxRidersPerEvent, classLocationOverrides, classDayOverrides}
  schedule_extras jsonb default '{}'::jsonb,

  -- Real IANA timezone, distinct from organizations.timezone: one org can run
  -- shows in different time zones. Null means "show local venue time as-is"
  -- rather than silently inheriting the org's zone.
  timezone text,

  -- A structural discriminator (drives default-catalog behaviour when picking
  -- events), not a display detail.
  show_type text check (show_type is null or show_type in ('rated', 'schooling')),

  -- What rider #1's bib number starts at. Riders are numbered sequentially
  -- from here, zero-padded to 4 digits.
  starting_rider_number integer default 101,

  -- [{id, label, requiresExpiration, requiresApproval}]. requiresApproval
  -- flags documents a staff member must actually review before they count as
  -- satisfied, versus merely being on file.
  document_requirements jsonb default '[]'::jsonb,

  -- Null means the organizer has not written one yet; the rider-facing view
  -- falls back to a clearly-marked placeholder rather than presenting
  -- placeholder legal text as if it were real.
  waiver_text text,

  -- Going live is a real legal-liability decision, so the organizer must
  -- explicitly approve the waiver text. waiver_approved_text is a snapshot of
  -- what was approved: if waiver_text is edited afterwards without
  -- re-approval the two differ and go-live blocks again. Text equality is the
  -- gate; waiver_approved_at is informational only.
  waiver_approved_at timestamptz,
  waiver_approved_text text,

  -- Vendor-side equivalents of the two blocks above.
  vendor_document_requirements jsonb default '[]'::jsonb,
  vendor_agreement_text text,

  -- Setup-side merch config only. Sales themselves are rows in merch_sales.
  merchandise_enabled boolean default false,
  merch_items jsonb default '[]'::jsonb, -- [{id, name, price}]

  -- {status: 'draft'|'published', stables: [{id, name, stallCount, rowCount,
  --   stalls: [{id, number, label, horseId, horseName, riderName, shavings}]}]}
  -- `label` is editable separately from `number` because real stable signage
  -- rarely runs a clean 1..N ("C4" instead of "5" is exactly why).
  stable_chart jsonb default '{}'::jsonb,

  -- Staff-added horses with no class_entries row behind them: covers both "the
  -- organizer adds their own horse" and "a staff member is also riding".
  -- Deliberately not real horses/riders rows — neither person necessarily has
  -- or wants a full rider account just to appear on the stable chart.
  -- [{id, riderName, horseName, isStallion, addedAt}]
  manual_horses jsonb default '[]'::jsonb,

  -- [{id, label, amount}] — a cost checklist, not a ledger. The simple P&L is
  -- revenue from paid orders minus the sum of these.
  expenses jsonb default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index shows_org_id_idx on public.shows (org_id);
create index shows_venue_id_idx on public.shows (venue_id);

-- The rider-facing show list filters on published state and sorts by date.
create index shows_published_idx on public.shows (published, start_date);

comment on table public.shows is
  'A competition. Almost every other table in this schema is show-scoped.';

-- ---------------------------------------------------------------------------
-- Role assignments
-- ---------------------------------------------------------------------------
-- A flat user <-> show <-> role join. This is what makes "one user holds
-- several roles across several shows and organizations" representable; the
-- pre-migration model treated a role as a single global attribute of a user.
-- `scope` carries optional per-ring / per-class narrowing without needing a
-- schema change.
create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  role text not null,
  scope jsonb,
  created_at timestamptz not null default now(),

  unique (user_id, show_id, role)
);

create index role_assignments_user_id_idx on public.role_assignments (user_id);
create index role_assignments_show_id_idx on public.role_assignments (show_id);
