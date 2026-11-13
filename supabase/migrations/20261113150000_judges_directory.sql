-- Judges directory: one master record per judge, reusable across shows.
--
-- Until now a judge was re-typed for every show (staff_assignments is per show),
-- and their USEF ID lived on each of those rows. A judge is a person, like a
-- venue is a place: the organization keeps one record, brings it into any show,
-- and the USEF ID goes with it.
--
-- Private to the organization (unlike venues, which are a shared directory):
-- a judge record carries an email and phone number. Judges only; scribes,
-- announcers and stewards stay per-show. Everything here is additive.

create table if not exists public.judges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  name text not null,
  email text,
  phone text,

  -- usef_id_source: where the value came from. 'manual' = typed in by a person;
  -- 'usef' = set by the planned USEF integration, the only source a sync may
  -- overwrite silently. usef_id_entered_by says which person typed a manual one.
  usef_id text check (usef_id is null or usef_id ~ '^[0-9]+$'),
  usef_id_source text check (usef_id_source in ('manual', 'usef')),
  usef_id_entered_by text check (usef_id_entered_by in ('judge', 'organizer')),
  usef_id_verified_at timestamptz,
  usef_id_updated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.judges is
  'Reusable judge records, private to one organization. A show''s judge is a staff_assignments row linked here by judge_id.';

-- One record per person per organization. Judges without an email are never merged.
create unique index if not exists judges_org_email_key
  on public.judges (org_id, lower(email))
  where email is not null;

create index if not exists judges_org_idx on public.judges (org_id);

alter table public.judges enable row level security;

create policy judges_org_all on public.judges
  for all
  using (public.can_access_org(org_id))
  with check (public.can_access_org(org_id));

-- A show's judge points back at the master record. SET NULL so removing a
-- directory entry never deletes a show's staff row (its own usef_id stays as a
-- fallback for the export).
alter table public.staff_assignments
  add column if not exists judge_id uuid references public.judges (id) on delete set null;

create index if not exists staff_assignments_judge_idx on public.staff_assignments (judge_id)
  where judge_id is not null;

-- Backfill: one judge per (organization, email) from the Judge rows that already
-- exist. The newest row wins, preferring a row that has a USEF ID. Rows without an
-- email are left alone. Safe to run twice: it only touches unlinked rows and the
-- unique index absorbs repeats.
with candidates as (
  select
    s.org_id,
    lower(btrim(sa.email)) as email,
    coalesce(sa.first_name, '') as first_name,
    coalesce(sa.last_name, '') as last_name,
    sa.name,
    nullif(btrim(sa.phone), '') as phone,
    case when sa.usef_id ~ '^[0-9]+$' then sa.usef_id end as usef_id,
    sa.usef_id_source,
    sa.usef_id_verified_at,
    sa.created_at,
    row_number() over (
      partition by s.org_id, lower(btrim(sa.email))
      order by (sa.usef_id ~ '^[0-9]+$') desc nulls last, sa.created_at desc, sa.id
    ) as rn
  from public.staff_assignments sa
  join public.shows s on s.id = sa.show_id
  where sa.role = 'Judge'
    and sa.judge_id is null
    and sa.email is not null
    and btrim(sa.email) <> ''
)
insert into public.judges (
  org_id, first_name, last_name, name, email, phone,
  usef_id, usef_id_source, usef_id_entered_by, usef_id_verified_at, usef_id_updated_at
)
select
  org_id, first_name, last_name, name, email, phone,
  usef_id,
  case when usef_id is not null then coalesce(usef_id_source, 'manual') end,
  case when usef_id is not null then 'organizer' end,
  usef_id_verified_at,
  case when usef_id is not null then created_at end
from candidates
where rn = 1
on conflict (org_id, lower(email)) where email is not null do nothing;

update public.staff_assignments sa
set judge_id = j.id
from public.shows s, public.judges j
where s.id = sa.show_id
  and j.org_id = s.org_id
  and j.email = lower(btrim(sa.email))
  and sa.role = 'Judge'
  and sa.judge_id is null;
