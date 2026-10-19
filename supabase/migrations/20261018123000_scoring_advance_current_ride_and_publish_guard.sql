-- Only the ride in the ring can be scored; no publishing with rides left.
-- Re-runnable.
--
-- Stress test 2026-10-17:
--   #26  Advancing ride 3 while ride 1 was on course marked ride 3 scored,
--        and the ring then treated riders 1 and 2 as already gone.
--   #25  Results were published with no rides scored; under load, 4 classes
--        published with rides that were never scored.
--
-- 1. A ride can only move to status 'scored' while it is the ride in the
--    ring: the class's worked-in entry, or else the first unfinished,
--    non-holding ride in running order (same rule as the app's
--    resolveCurrentRideIndex / pickRideInRing). Scratching or disqualifying
--    a later rider ahead of time is unaffected. To score out of order, show
--    management works the rider in first.
-- 2. classes.results_published can only turn on when no non-holding ride
--    is still unscored (status 'scheduled'); scratched and disqualified
--    rides count as finished. There is no override: scratch, finish or
--    remove those rides first.
-- Trusted roles (service role, migrations, seed scripts) are not limited.

-- The ride in the ring right now, or null when the class is finished.
create or replace function public.class_ride_in_ring(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select c.working_in_entry_id from public.classes c where c.id = p_class_id),
    (
      select e.id
      from public.class_entries e
      where e.class_id = p_class_id
        and coalesce(e.holding, false) = false
        and not (coalesce(e.advanced_past, false) or coalesce(e.status, 'scheduled') <> 'scheduled')
      order by e.ride_order, e.id
      limit 1
    )
  );
$$;

revoke execute on function public.class_ride_in_ring(uuid) from public, anon;
grant execute on function public.class_ride_in_ring(uuid) to authenticated, service_role;

create or replace function public.assert_only_ride_in_ring_scored()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() then
    return new;
  end if;

  if new.status = 'scored'
     and old.status is distinct from 'scored'
     and public.class_ride_in_ring(new.class_id) is distinct from new.id then
    raise exception 'Only the rider in the ring can be scored. Work this rider in first to score them out of order.'
      using errcode = 'FA022';
  end if;
  return new;
end;
$$;

drop trigger if exists class_entries_score_ride_in_ring on public.class_entries;
create trigger class_entries_score_ride_in_ring
  before update on public.class_entries
  for each row execute function public.assert_only_ride_in_ring_scored();

create or replace function public.class_unscored_ride_count(p_class_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.class_entries e
  where e.class_id = p_class_id
    and coalesce(e.holding, false) = false
    and coalesce(e.status, 'scheduled') = 'scheduled';
$$;

revoke execute on function public.class_unscored_ride_count(uuid) from public, anon;
grant execute on function public.class_unscored_ride_count(uuid) to authenticated, service_role;

create or replace function public.assert_publish_requires_scored_rides()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_unscored integer;
begin
  if public.is_trusted_db_role() then
    return new;
  end if;

  if coalesce(new.results_published, false) and not coalesce(old.results_published, false) then
    v_unscored := public.class_unscored_ride_count(new.id);
    if v_unscored > 0 then
      raise exception '% ride(s) in this class are not scored yet. Score, scratch or remove them before publishing.', v_unscored
        using errcode = 'FA023';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists classes_publish_requires_scored_rides on public.classes;
create trigger classes_publish_requires_scored_rides
  before update on public.classes
  for each row execute function public.assert_publish_requires_scored_rides();
