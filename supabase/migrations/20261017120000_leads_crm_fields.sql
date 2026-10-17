-- Sales pipeline CRM: location, demo no-show, and the link from a lead to the
-- organizer account it was invited as (so "Invite pending" / "Signed up" can
-- be read live from users.onboarded_at instead of being tracked by hand).
alter table public.leads
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists demo_no_show boolean not null default false,
  add column if not exists invited_at timestamptz,
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

create index if not exists leads_org_id_idx on public.leads (org_id);
