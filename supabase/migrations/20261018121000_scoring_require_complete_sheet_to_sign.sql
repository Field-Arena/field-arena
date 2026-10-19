-- A scoresheet can only be signed when it is complete. Re-runnable.
--
-- Stress test 2026-10-17 (#24): a judge signed a sheet with a movement left
-- blank and the server accepted it; the blank counted as 0 and the published
-- score was 65.9% instead of 70%. Under load, marks that failed to save left
-- 15 signed sheets with a missing mark. The app now checks completeness in
-- submitScoresheet, but a direct PostgREST write (or a race between that
-- check and the update) could still sign an incomplete sheet.
--
-- This trigger refuses the transition to submitted unless the sheet is
-- complete against the ride's effective test, using the same rules as
-- src/modules/scoring:
--   effective test   class_entries.test_override when it has at least one
--                    movement, else class_tests for the class, else the
--                    class's scoring_catalog entry (getEffectiveTestForEntry,
--                    resolveEffectiveTest, parseTestDefinition).
--   complete         every movement (n ?? num > 0) and every collective
--                    (non-empty key) has a numeric mark (marksComplete,
--                    parseMarkMap), OR errors of course reach the test's
--                    elimination threshold: 2 for FEI senior tests, 3
--                    otherwise (errorDeduction / deductionSchedule).
-- A ride with no test at all can't be signed (same as the app).
-- Trusted roles (service role, migrations) are not limited.

-- jsonb number, or numeric string, as numeric; null otherwise (mirrors
-- Number(...) for the shapes test definitions actually use).
create or replace function public.jsonb_to_numeric(p_value jsonb)
returns numeric
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when jsonb_typeof(p_value) = 'number' then (p_value #>> '{}')::numeric
    when jsonb_typeof(p_value) = 'string' and (p_value #>> '{}') ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'
      then trim(p_value #>> '{}')::numeric
    else null
  end;
$$;

-- The test a ride is scored against, as {name, movements, collectives}.
create or replace function public.effective_test_for_entry(p_entry_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'name', case when jsonb_typeof(e.test_override -> 'name') = 'string'
                     then e.test_override ->> 'name' else '' end,
        'movements', e.test_override -> 'movements',
        'collectives', e.test_override -> 'collectives'
      )
      from public.class_entries e
      where e.id = p_entry_id
        and jsonb_typeof(e.test_override) = 'object'
        and jsonb_typeof(e.test_override -> 'movements') = 'array'
        and exists (
          select 1 from jsonb_array_elements(e.test_override -> 'movements') m
          where jsonb_typeof(m) = 'object'
            and public.jsonb_to_numeric(coalesce(m -> 'n', m -> 'num')) > 0
        )
    ),
    (
      select jsonb_build_object('name', ct.name, 'movements', ct.movements, 'collectives', ct.collectives)
      from public.class_entries e
      join public.class_tests ct on ct.class_id = e.class_id
      where e.id = p_entry_id
    ),
    (
      select jsonb_build_object(
        'name', case when jsonb_typeof(sc.def -> 'name') = 'string'
                     then sc.def ->> 'name' else sc.title end,
        'movements', sc.def -> 'movements',
        'collectives', sc.def -> 'collectives'
      )
      from public.class_entries e
      join public.classes c on c.id = e.class_id
      join public.scoring_catalog sc on sc.id::text = c.catalog_id
      where e.id = p_entry_id
        and jsonb_typeof(sc.def) = 'object'
    )
  );
$$;

revoke execute on function public.effective_test_for_entry(uuid) from public, anon;
grant execute on function public.effective_test_for_entry(uuid) to authenticated, service_role;

-- Errors of course that eliminate under this test (deductionSchedule).
create or replace function public.test_elimination_errors(p_test_name text)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when coalesce(p_test_name, '') ~* 'young horse'
      or coalesce(p_test_name, '') ~* '\y[4-8][[:space:]-]?year[[:space:]-]?old\y' then 3
    when coalesce(p_test_name, '') ~* '\yFEI\y|Prix St|Grand Prix|\yIntermediate\y|\yPSG\y' then 2
    else 3
  end;
$$;

-- Is a mark map entry filled in? {value: <number>} or a bare number.
create or replace function public.score_mark_present(p_marks jsonb, p_key text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when jsonb_typeof(p_marks) <> 'object' then false
    when jsonb_typeof(p_marks -> p_key) = 'number' then true
    when jsonb_typeof(p_marks -> p_key) = 'object'
      then jsonb_typeof(p_marks -> p_key -> 'value') = 'number'
    else false
  end;
$$;

-- Could this sheet be signed? Null test = no.
create or replace function public.score_sheet_is_complete(
  p_entry_id uuid,
  p_movements jsonb,
  p_collectives jsonb,
  p_errors integer
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_test jsonb := public.effective_test_for_entry(p_entry_id);
begin
  if v_test is null then
    return false;
  end if;

  if coalesce(p_errors, 0) >= public.test_elimination_errors(v_test ->> 'name') then
    return true;
  end if;

  if jsonb_typeof(v_test -> 'movements') = 'array' and exists (
    select 1
    from jsonb_array_elements(v_test -> 'movements') m,
         lateral (select public.jsonb_to_numeric(coalesce(m -> 'n', m -> 'num')) as num) n
    where jsonb_typeof(m) = 'object'
      and n.num > 0
      and not public.score_mark_present(p_movements, trim_scale(n.num)::text)
  ) then
    return false;
  end if;

  if jsonb_typeof(v_test -> 'collectives') = 'array' and exists (
    select 1
    from jsonb_array_elements(v_test -> 'collectives') c
    where jsonb_typeof(c) = 'object'
      and jsonb_typeof(c -> 'key') = 'string'
      and (c ->> 'key') <> ''
      and not public.score_mark_present(p_collectives, c ->> 'key')
  ) then
    return false;
  end if;

  return true;
end;
$$;

revoke execute on function public.score_sheet_is_complete(uuid, jsonb, jsonb, integer)
  from public, anon;
grant execute on function public.score_sheet_is_complete(uuid, jsonb, jsonb, integer)
  to authenticated, service_role;

create or replace function public.assert_score_complete_to_sign()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() then
    return new;
  end if;

  if coalesce(new.submitted, false)
     and (tg_op = 'INSERT' or not coalesce(old.submitted, false))
     and not public.score_sheet_is_complete(new.entry_id, new.movements, new.collectives, new.errors)
  then
    raise exception 'Every movement and collective mark needs a value before signing.'
      using errcode = 'FA021';
  end if;
  return new;
end;
$$;

-- "scores_b_" so it runs after scores_a_sync_error_count (same-event row
-- triggers fire alphabetically) and sees the recomputed errors count.
drop trigger if exists scores_b_require_complete_to_sign on public.scores;
create trigger scores_b_require_complete_to_sign
  before insert or update on public.scores
  for each row execute function public.assert_score_complete_to_sign();
