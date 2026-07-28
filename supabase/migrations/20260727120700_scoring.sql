-- Scoring: test definitions, ride order, judge panels, and scoresheets.
--
-- Legacy source: `class_tests`, `class_entries`, `class_panel`, `scores`,
-- `scoring_catalog`, `test_templates`.
--
-- The pre-migration scoring screen ran entirely in one browser tab's memory and
-- was self-labelled "Needs server": a test definition, a rider roster, a
-- multi-judge panel and a per-rider/per-judge scoresheet, synced to the
-- announcer view only by a random local timer. These tables give all of that a
-- real home. The mark maps stay jsonb because their keys are movement numbers
-- and collective keys defined by the test itself, not a fixed column set.

-- ---------------------------------------------------------------------------
-- Test definition — one per class
-- ---------------------------------------------------------------------------
create table public.class_tests (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null unique references public.classes (id) on delete cascade,
  name text not null,
  edition text,
  movements jsonb default '[]'::jsonb,   -- [{n, text, coef}]
  collectives jsonb default '[]'::jsonb  -- [{key, label, coef}]
);

-- ---------------------------------------------------------------------------
-- Ride order / roster
-- ---------------------------------------------------------------------------
create table public.class_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,

  draw integer,

  -- Text, not integer: bib numbers commonly carry leading zeros ("0007").
  num text not null,

  -- Display source of truth for rider and horse. Every entry an organizer
  -- seeds or moves (roster import, move-entry) has no real rider account behind
  -- it and never will, so these text fields are universal while the FKs below
  -- are additive.
  rider text,
  horse text,

  rider_id uuid references public.riders (id) on delete set null,
  horse_id uuid references public.horses (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,

  -- Renamed from the legacy `order`: "order" is a reserved word, and the legacy
  -- schema had already set this precedent by renaming `group` to `group_name`
  -- on classes. Quoting a reserved identifier at every read site is a standing
  -- invitation to a syntax error.
  ride_order integer not null,

  status text default 'scheduled'
    check (status in ('scheduled', 'scored', 'scratched', 'disqualified')),

  advanced_past boolean default false,

  -- Mixed-type by design: a number as text, or 'SCR' / 'ELIM'. Matches the
  -- scoring view's own field shape.
  final_pct text,

  -- {[judgeSeatId]: pct}
  judge_pct jsonb default '{}'::jsonb,

  -- A post-hoc audit note on an already-confirmed score.
  correction text,

  -- Required whenever status becomes 'disqualified', and never used for a
  -- scratch (which has nothing to explain). Distinct from `correction`: this is
  -- *why* the entry was disqualified. Enforced by the trigger below rather than
  -- a CHECK, so the message can name the actual rule.
  reason text,

  -- When the entry was finalized (scored, scratched or disqualified) — not when
  -- the row was created, which is merely roster-seed time.
  finalized_at timestamptz,

  -- True means the entry was added out-of-band and is not part of the numbered
  -- ride order; it rides only when explicitly worked in. Excluded from
  -- order-based sorting and advance logic.
  holding boolean default false,

  -- An open-ride rider can be slotted into a class but score against a
  -- different test than their classmates. A full self-contained definition
  -- ({name, edition, movements, collectives}) copied at add-time rather than a
  -- foreign key, so it cannot drift if the class's own test is edited later.
  test_override jsonb,

  unique (class_id, num)
);

create index class_entries_class_id_idx on public.class_entries (class_id);
create index class_entries_rider_id_idx on public.class_entries (rider_id);
create index class_entries_order_id_idx on public.class_entries (order_id);

-- The ride-order query that drives the scoring screen and the live board.
create index class_entries_ride_order_idx on public.class_entries (class_id, ride_order)
  where holding = false;

-- A disqualification must carry a reason. Scratches must not be forced to.
create or replace function public.assert_dq_has_reason()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'disqualified'
     and (new.reason is null or btrim(new.reason) = '') then
    raise exception 'a disqualification requires a reason';
  end if;
  return new;
end;
$$;

create trigger class_entries_dq_reason
  before insert or update on public.class_entries
  for each row execute function public.assert_dq_has_reason();

-- Deferred FK from the previous migration: the emergency work-in slot points at
-- an entry, which only exists as a table now.
alter table public.classes
  add constraint classes_working_in_entry_id_fkey
  foreign key (working_in_entry_id)
  references public.class_entries (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Judge panel
-- ---------------------------------------------------------------------------
-- A real multi-judge panel, needed because classes.judges_count already allowed
-- N judges per class while class_assignments only had a single judge+scribe pair.
create table public.class_panel (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,

  seat_id text not null, -- 'J1', 'J2', ...
  position text,         -- 'C', 'H', 'M', ... judging position at the ring

  judge_staff_id uuid references public.staff_assignments (id) on delete set null,
  scribe_staff_id uuid references public.staff_assignments (id) on delete set null,

  unique (class_id, seat_id)
);

create index class_panel_class_id_idx on public.class_panel (class_id);

-- ---------------------------------------------------------------------------
-- Scoresheets — one per (entry, judge seat)
-- ---------------------------------------------------------------------------
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  entry_id uuid not null references public.class_entries (id) on delete cascade,
  seat_id text not null,

  movements jsonb default '{}'::jsonb,   -- {[n]: {value, enteredBy}}
  collectives jsonb default '{}'::jsonb, -- {[key]: {value, enteredBy}}

  -- `errors` is the count of true entries in error_at, which records WHICH
  -- movement each error of course happened on.
  errors integer default 0,
  error_at jsonb default '{}'::jsonb, -- {[movementN]: true}

  remarks jsonb default '{}'::jsonb,  -- {[n]: text}

  -- The judge's overall closing note on the ride as a whole, separate from the
  -- per-movement remarks above. Applies uniformly to catalog tests, Test of
  -- Choice and builder sheets, since all three render through this same row.
  final_remarks text,

  submitted boolean default false,

  -- The judge's own attestation that the sheet is final, captured at the moment
  -- they sign rather than derived from `submitted` — so the name and timestamp
  -- survive even if the sheet is later reopened by a mark change.
  signed_by text,
  signed_at timestamptz,

  updated_at timestamptz not null default now(),

  unique (entry_id, seat_id)
);

create index scores_class_id_idx on public.scores (class_id);
create index scores_entry_id_idx on public.scores (entry_id);

create trigger scores_set_updated_at
  before update on public.scores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Platform scoring catalog
-- ---------------------------------------------------------------------------
-- The canonical, platform-level test-sheet library curated centrally, which
-- every organizer's show draws from. Distinct from test_templates below, which
-- is one org's private library.
--
-- `def`'s shape depends on `family`:
--   movement   -> {intro, purpose, arena, rideTime, maxPoints,
--                  errorScheduleText, footNote, movements, collectives}
--   freestyle  -> {technical, artistic}
--   weighted   -> {categories}
--   placing    -> {method, criteria}
--   unassigned -> {}
-- Stored as one jsonb document rather than modeled relationally because the
-- editor treats it as one nested document and nothing reads inside it
-- structurally.
create table public.scoring_catalog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text,
  discipline text default 'Dressage',
  family text default 'unassigned'
    check (family in ('movement', 'freestyle', 'weighted', 'placing', 'unassigned')),

  source text,      -- free-text provenance note
  source_file text, -- matches an uploaded source PDF, if any
  governing_body text,

  def jsonb default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scoring_catalog_discipline_idx on public.scoring_catalog (discipline, level);
create index scoring_catalog_governing_body_idx on public.scoring_catalog (governing_body);

create trigger scoring_catalog_set_updated_at
  before update on public.scoring_catalog
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Org-private test templates ("Test Builder")
-- ---------------------------------------------------------------------------
-- The movement/collective shapes deliberately mirror class_tests, so "use this
-- template for a class" copies these arrays straight across with no reshaping.
create table public.test_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,

  -- Free text, e.g. "Training Level" — the organizer's own label, not a
  -- controlled vocabulary.
  level text,

  -- e.g. "Cloned from Training Level Test 4" — provenance shown in the builder,
  -- never used for logic.
  source_label text,

  movements jsonb default '[]'::jsonb,   -- [{num, text, coef}]
  collectives jsonb default '[]'::jsonb, -- [{key, label, coef}]

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index test_templates_org_id_idx on public.test_templates (org_id);

create trigger test_templates_set_updated_at
  before update on public.test_templates
  for each row execute function public.set_updated_at();
