-- Judge-precedence, moved from application code into the database.
--
-- Legacy refused a scribe's overwrite of a judge-entered mark at its own write
-- boundary (api/shows/[id]/[resource].js:1229):
--
--   'A judge-entered mark cannot be overwritten by a scribe.'  -- 409
--
-- Field-Arena ports the rule in writeMark(), and the UI greys the field out via
-- isLockedFor() — but scores_write RLS is only canEnterScores, which every
-- Scribe holds. So the rule holds through the app and not through PostgREST:
-- verified live, a Scribe overwrote two judge-entered marks by UPDATEing the
-- row directly, rewriting `enteredBy` to "scribe" in the process.
--
-- Legacy also hid the error-of-course toggle on a judge-owned movement
-- (showrunner-scoring.html:1273, `lockedForScribe ? '' : errToggle`). Errors
-- subtract from the score and eliminate at three, so a scribe flipping one on
-- a judge's movement changes the judge's result without touching a mark.
--
-- One BEFORE UPDATE trigger covers both write paths: merge_score_json performs
-- an ordinary UPDATE internally, so it fires this too. The caller's role is
-- resolved from class_panel rather than trusted from the payload — otherwise a
-- scribe could simply claim `enteredBy: "judge"` and walk straight past it.

create or replace function public.scores_seat_role(p_class_id uuid, p_seat_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1 from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = p_class_id and p.seat_id = p_seat_id
        and (sa.user_id = auth.uid()
             or sa.email = (select email from public.users where id = auth.uid()))
    ) then 'judge'
    when exists (
      select 1 from public.class_panel p
      join public.staff_assignments sa on sa.id = p.scribe_staff_id
      where p.class_id = p_class_id and p.seat_id = p_seat_id
        and (sa.user_id = auth.uid()
             or sa.email = (select email from public.users where id = auth.uid()))
    ) then 'scribe'
    else null
  end;
$$;

create or replace function public.assert_scribe_mark_precedence()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller text;
  k text;
begin
  -- Organizer / Show Admin / SuperAdmin are not panel seats at all and already
  -- bypass the seat check in assertSeatAccess; nothing to enforce for them.
  if public.has_show_permission(public.class_show_id(new.class_id), 'canEditShow') then
    return new;
  end if;

  caller := public.scores_seat_role(new.class_id, new.seat_id);
  if caller is distinct from 'scribe' then
    return new;
  end if;

  -- Marks: a key the judge owns may not be changed by the scribe, in value or
  -- in provenance. Keys the judge does not own are the scribe's normal work.
  for k in select jsonb_object_keys(coalesce(new.movements, '{}'::jsonb)) loop
    if coalesce(old.movements, '{}'::jsonb) -> k ->> 'enteredBy' = 'judge'
       and (coalesce(old.movements, '{}'::jsonb) -> k) is distinct from (new.movements -> k) then
      raise exception 'A judge-entered mark cannot be overwritten by a scribe.';
    end if;
  end loop;

  for k in select jsonb_object_keys(coalesce(new.collectives, '{}'::jsonb)) loop
    if coalesce(old.collectives, '{}'::jsonb) -> k ->> 'enteredBy' = 'judge'
       and (coalesce(old.collectives, '{}'::jsonb) -> k) is distinct from (new.collectives -> k) then
      raise exception 'A judge-entered mark cannot be overwritten by a scribe.';
    end if;
  end loop;

  -- Error-of-course flags follow the movement they sit on.
  for k in select jsonb_object_keys(coalesce(new.error_at, '{}'::jsonb)) loop
    if coalesce(old.movements, '{}'::jsonb) -> k ->> 'enteredBy' = 'judge'
       and (coalesce(old.error_at, '{}'::jsonb) -> k) is distinct from (new.error_at -> k) then
      raise exception 'An error of course on a judge-entered movement cannot be changed by a scribe.';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists scores_scribe_precedence_check on public.scores;
create trigger scores_scribe_precedence_check
  before update on public.scores
  for each row execute function public.assert_scribe_mark_precedence();
