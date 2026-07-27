-- Scheduled cleanup of stale pending orders.
--
-- Ported from the legacy Vercel cron job api/cron/cleanup-stale-orders.js, which
-- ran hourly via the `crons` block in vercel.json. Moving it into pg_cron keeps
-- the whole backend on Supabase: there is no HTTP endpoint to secure with a
-- CRON_SECRET, and no serverless function to keep warm.
--
-- Carried over from the earlier uncommitted version of this migration, which had
-- already made the same call.

create extension if not exists pg_cron with schema extensions;

create or replace function public.abandon_stale_orders()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.orders
     set status = 'abandoned'
   where status = 'pending'
     and created_at < now() - interval '6 hours';
$$;

comment on function public.abandon_stale_orders() is
  'Marks pending orders older than 6h as abandoned. Scheduled hourly via pg_cron.';

-- cron.schedule upserts on the job name, so re-running this migration is safe.
select cron.schedule(
  'abandon-stale-orders',
  '0 * * * *',
  $$select public.abandon_stale_orders()$$
);

-- The domain-health cron from the legacy vercel.json (check-domain-health, every
-- 15 minutes) is deliberately not ported. It probed external DNS via the Vercel
-- API, which Postgres cannot reach and should not try to; it needs to be
-- rebuilt as a Supabase Edge Function with its own schedule.
