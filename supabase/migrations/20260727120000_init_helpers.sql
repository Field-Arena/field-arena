-- Foundation: extensions and shared trigger helpers.
--
-- Ported from the legacy Drizzle schema (api/_lib/schema.js in the previous
-- static/Vercel codebase). Two identity systems there — Clerk for staff and a
-- bespoke bcrypt+opaque-token system for riders — both collapse onto Supabase
-- Auth here, so `password_hash`, `clerk_user_id`, `sessions` and
-- `rider_sessions` are deliberately absent: Supabase owns credentials and
-- session lifetime now.

create extension if not exists "pgcrypto";

-- Every table that carried an `updatedAt` column in the legacy schema relied
-- on the application to set it on each write. That is easy to forget in one
-- code path and silently wrong forever after, so it becomes a trigger here.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: stamps updated_at on every UPDATE. Attached per-table below.';
