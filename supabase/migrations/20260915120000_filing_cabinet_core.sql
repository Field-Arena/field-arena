-- Documents filing cabinet: core tables.
-- Bridle number: per (show, horse), shared by every rider entering that horse.
create table public.show_horses (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  horse_id uuid references public.horses (id) on delete set null,
  horse_name text not null, -- denormalized, mirrors class_entries.horse for unlinked horses
  bridle_number text not null,
  created_at timestamptz not null default now()
);
create unique index show_horses_by_horse_id_idx on public.show_horses (show_id, horse_id) where horse_id is not null;
create unique index show_horses_by_name_idx on public.show_horses (show_id, lower(horse_name)) where horse_id is null;
create unique index show_horses_bridle_unique_idx on public.show_horses (show_id, bridle_number);

-- One row per rider+horse "entry" for the show — the Entry Ledger's real
-- unit, distinct from class_entries (one row per class).
create table public.show_entries (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  show_horse_id uuid not null references public.show_horses (id) on delete cascade,
  rider_id uuid references public.riders (id) on delete set null,
  rider_name text not null,
  entry_number text not null,
  back_number text,
  status text not null default 'submitted'
    check (status in ('submitted', 'documents_received', 'documents_verified', 'checkin_released', 'cleared', 'scratched')),
  cleared_at timestamptz,
  cleared_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index show_entries_number_unique_idx on public.show_entries (show_id, entry_number);
create unique index show_entries_back_number_unique_idx on public.show_entries (show_id, back_number) where back_number is not null;
create index show_entries_show_horse_idx on public.show_entries (show_horse_id);
create index show_entries_rider_idx on public.show_entries (rider_id);

-- Nullable, additive FK: class_entries rows opt into an aggregate entry once
-- reconciled. Never touches num/status/existing scoring behavior.
alter table public.class_entries add column show_entry_id uuid references public.show_entries (id) on delete set null;
create index class_entries_show_entry_id_idx on public.class_entries (show_entry_id);

create table public.entry_issues (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  show_entry_id uuid not null references public.show_entries (id) on delete cascade,
  kind text not null check (kind in ('document', 'membership', 'number', 'note', 'request')),
  message text not null,
  detail text,
  link_kind text,
  link_id text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  source text not null default 'auto' check (source in ('auto', 'manual')),
  created_by uuid references public.users (id),
  resolved_at timestamptz,
  resolved_by uuid references public.users (id),
  resolution_note text,
  created_at timestamptz not null default now()
);
create index entry_issues_show_open_idx on public.entry_issues (show_id, status);
create index entry_issues_show_entry_idx on public.entry_issues (show_entry_id);

create table public.entry_membership_checks (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  show_entry_id uuid not null unique references public.show_entries (id) on delete cascade,
  member_database_id uuid references public.member_database (id) on delete set null,
  association text,
  rider_membership_number text,
  horse_registration_number text,
  owner_membership_number text,
  membership_status text not null default 'unknown' check (membership_status in ('active', 'inactive', 'unknown')),
  horse_registration_status text not null default 'unknown' check (horse_registration_status in ('active', 'inactive', 'unknown')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified', 'flagged')),
  flags jsonb not null default '[]'::jsonb, -- ['expired_membership'|'missing_horse_registration'|'owner_name_mismatch'|'missing_identifiers'|'other']
  notes text,
  verified_at timestamptz,
  verified_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index entry_membership_checks_show_idx on public.entry_membership_checks (show_id);

comment on column public.horses.document_uploads is
  'Per-requirement uploads: [{requirementId, label, path, expirationDate, verified, status, rejectionReason, rejectionNote, replacementRequestedAt, reviewedAt, reviewedBy}]. '
  'status in (pending|approved|rejected|replacement_requested); legacy verified:boolean kept in sync '
  '(verified = status===approved) for back-compat reads until every read site migrates to status.';
