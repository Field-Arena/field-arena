-- Identity: staff users and riders.
--
-- The legacy codebase ran two *separate* identity systems on purpose: staff
-- authenticated through Clerk (`users` + `clerk_user_id`), riders through a
-- bespoke bcrypt + opaque-token system (`riders` + `rider_sessions`). The
-- stated reason was that mixing them would force every staff-gated route to
-- also assert "and not a rider".
--
-- Supabase Auth is now the single credential store, so that reasoning is
-- preserved structurally rather than by having two login systems: `auth.users`
-- holds the credential, and exactly one of these two profile tables holds the
-- role. A given auth user is either staff or a rider, never both — enforced by
-- the RLS policies in the final migration, not by convention.
--
-- Consequently absent from both tables: `password_hash`, `clerk_user_id`, and
-- the entire `sessions` / `rider_sessions` tables. Supabase owns all of that.

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
-- Role hierarchy, unchanged from legacy:
--   SuperAdmin              — platform-wide, org_id null
--   Organizer / ShowAdmin   — org-scoped, org_id set. ShowAdmin has identical
--                             access to Organizer except financial views.
--   Judge / Scribe / Announcer / ShowStaff / Vendor
--                           — org_id null; access is per-show and comes from
--                             staff_assignments, not from a fixed org.
create table public.users (
  -- Not a generated uuid: this *is* the Supabase Auth user id. Deleting the
  -- auth user removes the profile with it.
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,

  -- Denormalized from auth.users.email so staff lists and searches don't need
  -- to reach across into the auth schema (which RLS cannot join cheaply).
  -- Written by the application at invite-acceptance time.
  email text not null,

  platform_role text check (
    platform_role in (
      'SuperAdmin', 'Organizer', 'ShowAdmin',
      'Judge', 'Scribe', 'Announcer', 'ShowStaff', 'Vendor'
    )
  ),

  -- Set for Organizer/ShowAdmin only; null for SuperAdmin and for every
  -- per-show role.
  org_id uuid references public.organizations (id) on delete cascade,

  country text,
  created_at timestamptz not null default now()
);

create unique index users_email_key on public.users (lower(email));
create index users_org_id_idx on public.users (org_id);
create index users_platform_role_idx on public.users (platform_role);

comment on table public.users is
  'Staff profile keyed to auth.users. A rider never has a row here — see public.riders.';

-- ---------------------------------------------------------------------------
-- Riders
-- ---------------------------------------------------------------------------
create table public.riders (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,

  first_name text,
  last_name text,
  phone text,
  street text,
  city text,
  state text,
  zip text,

  -- Governing-body membership numbers. Free text: USEF and FEI formats differ
  -- and neither is validated server-side today.
  usef text,
  fei text,

  category text,

  -- Plain ISO 'YYYY-MM-DD' strings rather than a real date column, matching
  -- every other date-as-text column ported from the legacy schema. The legacy
  -- views do their own string comparison and parsing on these.
  dob text,

  -- Emergency contact.
  ec_first_name text,
  ec_last_name text,
  ec_rel text,
  ec_phone text,

  created_at timestamptz not null default now()
);

create unique index riders_email_key on public.riders (lower(email));

comment on table public.riders is
  'Rider profile keyed to auth.users. A staff member never has a row here — see public.users.';

-- A single auth user must not be both staff and rider. There is no way to
-- express a cross-table exclusion as a constraint, so it is enforced as a
-- trigger on both tables.
create or replace function public.assert_single_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'users' then
    if exists (select 1 from public.riders where id = new.id) then
      raise exception 'auth user % already has a rider profile', new.id;
    end if;
  else
    if exists (select 1 from public.users where id = new.id) then
      raise exception 'auth user % already has a staff profile', new.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger users_single_identity
  before insert on public.users
  for each row execute function public.assert_single_identity();

create trigger riders_single_identity
  before insert on public.riders
  for each row execute function public.assert_single_identity();
