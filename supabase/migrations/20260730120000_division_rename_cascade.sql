-- Divisions are referenced by name, not by id.
--
-- classes.division stores the division's NAME as free text (see the show_setup
-- migration), which the legacy build exploited: `updateSmDivision` in
-- showstaff.html PATCHed only the divisions row. Every class that named the old
-- division was orphaned the moment an organizer corrected a typo — its
-- classCount dropped to zero and award_scope='division' stopped pooling it with
-- anything, silently, mid-show.
--
-- Renaming has to touch both tables or neither, so it becomes one function
-- rather than two round trips from a Server Action. The same applies to delete:
-- removing the row while classes still name it leaves those classes pointing at
-- a division that no longer exists.
--
-- SECURITY INVOKER (the default) is deliberate — these run as the caller, so the
-- divisions and classes RLS policies still decide whether the write is allowed.
-- A definer function here would hand any signed-in user the ability to rename
-- divisions in someone else's show.

create or replace function public.rename_division(division_id uuid, new_name text)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  target_show uuid;
  old_name text;
begin
  select show_id, name into target_show, old_name
  from public.divisions
  where id = division_id;

  if target_show is null then
    raise exception 'Division not found';
  end if;

  if old_name = new_name then
    return;
  end if;

  if exists (
    select 1 from public.divisions
    where show_id = target_show and name = new_name and id <> division_id
  ) then
    raise exception 'This show already has a division called "%"', new_name;
  end if;

  update public.divisions set name = new_name where id = division_id;

  -- Scoped to the same show: division names are only unique within a show, so an
  -- unscoped update would rewrite identically-named divisions in every other
  -- show the caller can reach.
  update public.classes
  set division = new_name
  where show_id = target_show and division = old_name;
end;
$$;

comment on function public.rename_division(uuid, text) is
  'Renames a division and re-points every class naming it, in one transaction.';

create or replace function public.delete_division(division_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  target_show uuid;
  old_name text;
begin
  select show_id, name into target_show, old_name
  from public.divisions
  where id = division_id;

  if target_show is null then
    return;
  end if;

  -- Cleared rather than blocked. An organizer removing a division has already
  -- decided; refusing until every class is reassigned turns one action into a
  -- chore, and a null division is a state the classes table already allows.
  update public.classes
  set division = null
  where show_id = target_show and division = old_name;

  delete from public.divisions where id = division_id;
end;
$$;

comment on function public.delete_division(uuid) is
  'Deletes a division and clears the division name from its classes.';
