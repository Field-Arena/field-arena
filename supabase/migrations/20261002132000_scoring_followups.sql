-- Scoring follow-ups to the 2026-10-02 audit. Re-runnable.
--
-- Error-count race (Medium, "still open"): toggleErrorAt merged one key into
-- scores.error_at with merge_score_json, then read the row back and wrote
-- scores.errors = count(true) in a second statement. A judge and scribe
-- toggling at the same moment could each read before the other's merge and
-- write a stale count, and nothing stopped a direct PostgREST write from
-- setting `errors` to anything at all.
--
-- scores.errors is now derived in the database: a BEFORE INSERT/UPDATE
-- trigger recomputes it from error_at inside the same statement that changes
-- error_at, under that row's lock. merge_score_json stays SECURITY INVOKER
-- (RLS on scores still applies); its internal UPDATE fires this trigger like
-- any other write. The app no longer writes `errors`.
--
-- Trigger order: Postgres fires same-event row triggers alphabetically, so
-- scores_a_sync_error_count runs before scores_signed_locked
-- (20261002120000) and the signed-sheet lock sees the final `errors` value.

create or replace function public.scores_count_errors(p_error_at jsonb)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from jsonb_each(
    case when jsonb_typeof(p_error_at) = 'object' then p_error_at else '{}'::jsonb end
  ) as e(key, value)
  where e.value = 'true'::jsonb;
$$;

create or replace function public.sync_score_error_count()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Only when error_at (or errors itself) is being written: a row whose count
  -- predates this trigger is left alone on unrelated updates, so e.g. a
  -- signed sheet with a legacy mismatch isn't tripped by the signed-sheet lock.
  if tg_op = 'INSERT'
     or new.error_at is distinct from old.error_at
     or new.errors is distinct from old.errors then
    new.errors := public.scores_count_errors(new.error_at);
  end if;
  return new;
end;
$$;

drop trigger if exists scores_a_sync_error_count on public.scores;
create trigger scores_a_sync_error_count
  before insert or update on public.scores
  for each row execute function public.sync_score_error_count();

-- One-time backfill so every existing row matches its error_at. Signed rows
-- are skipped (the signed-sheet lock would refuse them, and their count is
-- part of what the judge signed).
update public.scores s
set errors = public.scores_count_errors(s.error_at)
where coalesce(s.submitted, false) = false
  and s.errors is distinct from public.scores_count_errors(s.error_at);
