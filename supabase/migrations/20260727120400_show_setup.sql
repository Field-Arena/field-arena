-- Organizer-side show setup: divisions, classes, staff, members, catalogs.
--
-- Legacy source: `divisions`, `classes`, `staff_assignments`,
-- `class_assignments`, `member_database`, `add_ons`, `qual_types`,
-- `independent_sheets`, `invites` in api/_lib/schema.js.

-- ---------------------------------------------------------------------------
-- Divisions
-- ---------------------------------------------------------------------------
create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,

  -- Organizer-defined sub-items (age brackets, weight classes, whatever fits
  -- their competition). Free text — no fixed taxonomy.
  subitems jsonb default '[]'::jsonb,

  -- Explicit sort order. A batch insert shares one now() per statement, so
  -- created_at alone ties and Postgres returns an unstable order on each fetch.
  position integer default 0
);

create index divisions_show_id_idx on public.divisions (show_id);

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,

  event text,

  -- "group" is a reserved word, hence the rename. This precedent is why
  -- class_entries."order" also becomes ride_order further down.
  group_name text,

  label text not null,

  -- An organizer-facing rename (typically a sponsor name) shown in place of
  -- `label` everywhere a rider or staff member sees the class. `label` itself
  -- never changes, so the judge still scores the same test sheet and every
  -- catalog_id / class_tests link stays valid. Null means "no rename".
  display_name text,

  division text,
  location text,
  arena text,
  judges_count integer default 1,

  fee numeric(12, 2) default 65,
  price_edited boolean default false,

  min_per_ride integer,
  date text, -- ISO date or ''
  time text, -- 'HH:MM' or ''

  qualifying boolean default false,
  qual_types jsonb default '[]'::jsonb,
  qual_fee numeric(12, 2),

  governing_body text,
  score_format text,
  catalog_id text,

  -- Test of Choice: an organizer-named class where a rider may ride any one of
  -- several acceptable tests rather than one fixed test. [{id, label}] — a
  -- free-text pairing rather than a real FK, because the two possible sources
  -- (the platform catalog and org test templates) do not share an id space.
  -- Empty means an ordinary single-test class.
  test_options jsonb default '[]'::jsonb,

  -- How many placings get a ribbon. Varies by organization and discipline (6
  -- and 8 are both common), so it is per-class rather than a platform-wide
  -- constant.
  ribbon_places integer default 6,

  -- Per-class override of the standard ribbon palette: [{bg, fg, name}], one
  -- entry per place. Null means "use the platform default colours".
  ribbon_colors jsonb,

  -- 'class'    — rank and ribbon this class's own entries alone (default).
  -- 'division' — pool with every class sharing the same `division`.
  -- 'group'    — pool with every class sharing the same `group_name`.
  -- Per-class, not per-show: an organizer may pool some events and not others
  -- within the same show.
  award_scope text not null default 'class'
    check (award_scope in ('class', 'division', 'group')),

  -- Live-scoring state: whether marks are still being entered, and where the
  -- ride order currently sits. A property of the class, not of any one
  -- rider or judge.
  scoring_open boolean default false,
  scoring_pos integer default 0,

  -- Emergency/late-rider holding queue: which entry (if any) is being ridden
  -- out of turn right now. Null means normal order. The FK is added at the end
  -- of this file, once class_entries exists.
  working_in_entry_id uuid,

  -- Final standings publish state, distinct from scoring_open: set once a class
  -- is done so riders and the live board can treat results as official.
  results_published boolean default false,
  results_published_at timestamptz,

  created_at timestamptz not null default now()
);

create index classes_show_id_idx on public.classes (show_id);
create index classes_division_idx on public.classes (show_id, division);
create index classes_group_name_idx on public.classes (show_id, group_name);

-- ---------------------------------------------------------------------------
-- Staff assignments
-- ---------------------------------------------------------------------------
-- Note the Organizer / account owner is deliberately NOT a row here. They hold
-- inherent power over their own show and are therefore not subject to any of
-- the per-person permission toggles below.
create table public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,

  name text not null,
  first_name text,
  last_name text,
  role text not null,
  phone text,
  email text,
  status text default 'pending' check (status in ('pending', 'accepted')),

  -- Only meaningful for role = 'Announcer'.
  is_steward boolean default false,

  -- Legacy per-person grants, superseded by `permissions` below but retained
  -- because the permission resolver still reads them as the lowest-precedence
  -- layer (object over role defaults over these two columns).
  can_scratch_skip_dq boolean default false,
  can_view_money boolean default false,

  -- The full per-person, per-show permission set. Splits the old single
  -- scratch/skip/DQ toggle into three independent grants and adds
  -- show-editing, staff-management, vendor-management, document-approval,
  -- score-entry, publish and roster-export.
  permissions jsonb default '{}'::jsonb,

  -- Set once this person accepts their invite; null means "invited but has not
  -- accepted yet", which `status` also tracks for display.
  user_id uuid references public.users (id) on delete set null,

  created_at timestamptz not null default now()
);

create index staff_assignments_show_id_idx on public.staff_assignments (show_id);
create index staff_assignments_user_id_idx on public.staff_assignments (user_id);

-- ---------------------------------------------------------------------------
-- Class assignments (single judge + scribe pairing)
-- ---------------------------------------------------------------------------
-- Real FKs to staff_assignments here. The pre-migration in-memory shape keyed
-- this by judge *name* string, which broke as soon as two judges shared a
-- surname. Superseded for multi-judge panels by class_panel, but retained
-- because single-judge classes are the common case.
create table public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  judge_staff_id uuid references public.staff_assignments (id) on delete set null,
  scribe_staff_id uuid references public.staff_assignments (id) on delete set null,

  unique (class_id)
);

-- ---------------------------------------------------------------------------
-- Member database (org-wide, not per-show)
-- ---------------------------------------------------------------------------
create table public.member_database (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,

  name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,

  -- Membership standing, distinct from a per-show staff or rider status: the
  -- member database is org-wide and predates any show a person appears on.
  membership_status text default 'active'
    check (membership_status in ('active', 'inactive')),
  membership_expires text, -- ISO 'YYYY-MM-DD'

  notes text,

  -- The custom field set grows dynamically via CSV import, so jsonb fits
  -- better than fixed columns or a full EAV table at this scale.
  extra_fields jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index member_database_org_id_idx on public.member_database (org_id);

-- ---------------------------------------------------------------------------
-- Rider-purchasable add-ons (stabling, shavings, tack stall, ...)
-- ---------------------------------------------------------------------------
create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,
  price numeric(12, 2) default 0,
  enabled boolean default true,
  qty integer, -- null = unlimited

  -- Per-unit stabling contribution, so the rider dashboard can derive real
  -- stall/tack/shavings/night counts from paid orders rather than hardcoding
  -- zero.
  stalls integer default 0,
  tack integer default 0,
  shavings integer default 0,
  nights integer default 0
);

create index add_ons_show_id_idx on public.add_ons (show_id);

-- ---------------------------------------------------------------------------
-- Show-level qualifying class types (FEI / USDF / USEF ...)
-- ---------------------------------------------------------------------------
-- The per-class opt-in into one of these lives on classes.qual_types/qual_fee.
create table public.qual_types (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,
  price numeric(12, 2) default 0,
  enabled boolean default false
);

create index qual_types_show_id_idx on public.qual_types (show_id);

-- ---------------------------------------------------------------------------
-- User-created custom scoring sheets, scoped to one show
-- ---------------------------------------------------------------------------
create table public.independent_sheets (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  title text not null,
  family text
);

create index independent_sheets_show_id_idx on public.independent_sheets (show_id);

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------
-- Supabase Auth issues the actual credential, but the invite row still exists:
-- it records *what role* an invitee is being granted and *for which show or
-- org*, which Supabase's own invite flow has no concept of. The legacy
-- token_hash column is gone — Supabase's invite link carries the secret now,
-- so storing a second one here would be an unnecessary credential to leak.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,

  -- Set for Organizer / ShowAdmin invites.
  org_id uuid references public.organizations (id) on delete cascade,

  -- Set for the per-show staff roles.
  show_id uuid references public.shows (id) on delete cascade,
  staff_assignment_id uuid references public.staff_assignments (id) on delete cascade,

  -- Only set by the "add SuperAdmin" flow. Per-show invites already carry a
  -- name via their staff_assignments row, so a bare SuperAdmin invite was the
  -- one path that would otherwise show as email-only in the pending list.
  name text,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references public.users (id) on delete set null
);

create index invites_email_idx on public.invites (lower(email));
create index invites_org_id_idx on public.invites (org_id);
create index invites_show_id_idx on public.invites (show_id);

-- Only one live invite per email per scope. Accepted/expired rows are exempt so
-- the same person can be re-invited later.
create unique index invites_pending_key
  on public.invites (lower(email), coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(show_id, '00000000-0000-0000-0000-000000000000'::uuid), role)
  where accepted_at is null;
