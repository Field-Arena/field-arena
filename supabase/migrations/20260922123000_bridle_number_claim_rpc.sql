-- assign_bridle_number: the single write path for bridle numbers now that
-- they come from an organizer-defined pool instead of being auto-counted.
-- Handles manual pick, "next available" auto-assign, and replace/correction
-- (retiring the old number as unavailable) — all atomically, under the same
-- per-show advisory lock resolve_show_entry_numbering already uses, so a
-- manual pick and a concurrent auto-assign can never race onto the same
-- number, and an explicit number is always re-validated against the pool
-- inside the lock (a bare unique-index catch would reject duplicates but
-- would not catch "never in any pack" or "explicitly retired").
create or replace function public.assign_bridle_number(
  p_show_id uuid,
  p_show_horse_id uuid,
  p_explicit_number integer default null,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_number text;
  v_new_number integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_show_id::text));

  select bridle_number into v_old_number
    from public.show_horses
   where id = p_show_horse_id and show_id = p_show_id;
  if not found then
    raise exception 'That horse is not part of this show.' using errcode = 'FA010';
  end if;

  if p_explicit_number is not null then
    if not exists (
      select 1 from public.show_bridle_numbers
       where show_id = p_show_id and number = p_explicit_number and status = 'available'
    ) then
      raise exception 'That number is not available.' using errcode = 'FA011';
    end if;
    v_new_number := p_explicit_number;
  else
    select number into v_new_number
      from public.show_bridle_numbers
     where show_id = p_show_id and status = 'available'
     order by number
     limit 1;
    if v_new_number is null then
      raise exception 'No available bridle numbers remain in the defined pool.' using errcode = 'FA012';
    end if;
  end if;

  -- Retire the old number, but only if it's actually a pool number — legacy
  -- bridle numbers assigned before this feature existed may not match the
  -- `^\d+$` shape (or any show_bridle_numbers row) and should just be
  -- dropped, not crash the replace.
  if v_old_number is not null and v_old_number ~ '^\d+$' then
    update public.show_bridle_numbers
       set status = 'unavailable', unavailable_reason = p_reason, show_horse_id = null
     where show_id = p_show_id and number = v_old_number::integer;
  end if;

  update public.show_bridle_numbers
     set status = 'assigned', show_horse_id = p_show_horse_id, unavailable_reason = null
   where show_id = p_show_id and number = v_new_number;

  update public.show_horses set bridle_number = v_new_number::text where id = p_show_horse_id;

  insert into public.bridle_number_changes (show_id, show_horse_id, old_number, new_number, reason, changed_by)
    values (p_show_id, p_show_horse_id, v_old_number, v_new_number::text, p_reason, auth.uid());

  return v_new_number::text;
end;
$$;

-- resolve_show_entry_numbering: only the bridle-number branch changes — a
-- newly-created show_horses row now starts with bridle_number = null
-- ("waiting for a number") instead of an auto-counted value. Entry and
-- back number generation (the two blocks below it) are untouched.
create or replace function public.resolve_show_entry_numbering(target_class_entry_id uuid)
returns table (out_show_entry_id uuid, out_bridle_number text, out_entry_number text, out_back_number text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_class_entry public.class_entries;
  v_class public.classes;
  v_show public.shows;
  v_rider_name text;
  v_show_horse_id uuid;
  v_bridle_number text;
  v_show_entry_id uuid;
  v_entry_number text;
  v_back_number text;
  v_count integer;
begin
  select * into v_class_entry from public.class_entries where id = target_class_entry_id;

  if v_class_entry.show_entry_id is not null then
    select se.id, sh.bridle_number, se.entry_number, se.back_number
      into out_show_entry_id, out_bridle_number, out_entry_number, out_back_number
      from public.show_entries se
      join public.show_horses sh on sh.id = se.show_horse_id
     where se.id = v_class_entry.show_entry_id;
    return next;
    return;
  end if;

  if v_class_entry.horse is null then
    return;
  end if;

  select * into v_class from public.classes where id = v_class_entry.class_id;

  -- Serializes every concurrent numbering resolution for this show;
  -- released automatically when this function's transaction ends.
  perform pg_advisory_xact_lock(hashtext(v_class.show_id::text));

  select * into v_show from public.shows where id = v_class.show_id;

  v_rider_name := nullif(trim(v_class_entry.rider), '');
  if v_rider_name is null and v_class_entry.rider_id is not null then
    select email into v_rider_name from public.riders where id = v_class_entry.rider_id;
  end if;
  if v_rider_name is null then
    return;
  end if;

  if v_class_entry.horse_id is not null then
    select id, sh.bridle_number into v_show_horse_id, v_bridle_number
      from public.show_horses sh
     where sh.show_id = v_class.show_id and sh.horse_id = v_class_entry.horse_id;
  else
    select id, sh.bridle_number into v_show_horse_id, v_bridle_number
      from public.show_horses sh
     where sh.show_id = v_class.show_id and sh.horse_id is null
       and lower(sh.horse_name) = lower(v_class_entry.horse);
  end if;

  if v_show_horse_id is null then
    v_bridle_number := null;
    insert into public.show_horses (show_id, horse_id, horse_name, bridle_number)
      values (v_class.show_id, v_class_entry.horse_id, v_class_entry.horse, v_bridle_number)
      returning id into v_show_horse_id;
  end if;

  if v_class_entry.rider_id is not null then
    select id into v_show_entry_id from public.show_entries
     where show_horse_id = v_show_horse_id and rider_id = v_class_entry.rider_id;
  else
    select id into v_show_entry_id from public.show_entries se
     where se.show_horse_id = v_show_horse_id and se.rider_id is null
       and lower(se.rider_name) = lower(v_rider_name);
  end if;

  if v_show_entry_id is null then
    select count(*) into v_count from public.show_entries where show_id = v_class.show_id;
    v_entry_number := lpad((v_show.starting_entry_number + v_count)::text, 3, '0');
    insert into public.show_entries (show_id, show_horse_id, rider_id, rider_name, entry_number)
      values (v_class.show_id, v_show_horse_id, v_class_entry.rider_id, v_rider_name, v_entry_number)
      returning id into v_show_entry_id;
  else
    select se.entry_number into v_entry_number from public.show_entries se where se.id = v_show_entry_id;
  end if;

  v_back_number := null;
  if v_show.back_number_enabled and v_class.requires_back_number then
    select se.back_number into v_back_number from public.show_entries se where se.id = v_show_entry_id;
    if v_back_number is null then
      if v_show.starting_back_number is null then
        raise exception 'Back numbers aren''t configured for this show yet.' using errcode = 'FA001';
      end if;
      select count(*) into v_count from public.show_entries se
       where se.show_id = v_class.show_id and se.back_number is not null;
      v_back_number := lpad((v_show.starting_back_number + v_count)::text, 3, '0');
      update public.show_entries set back_number = v_back_number, updated_at = now() where id = v_show_entry_id;
    end if;
  end if;

  update public.class_entries set show_entry_id = v_show_entry_id where id = target_class_entry_id;

  out_show_entry_id := v_show_entry_id;
  out_bridle_number := v_bridle_number;
  out_entry_number := v_entry_number;
  out_back_number := v_back_number;
  return next;
end;
$$;
