-- Loading the Entry Ledger renders <Link>s to every other filing-cabinet
-- tab; Next.js prefetches all of them immediately, so several routes end up
-- reconciling numbering for the same show within milliseconds of each
-- other. A client-side check-then-insert-with-retry can't close that race
-- across multiple HTTP round-trips (confirmed live: it still lost against
-- 3+ concurrent callers). Doing the whole find-or-create, for one
-- class_entries row, inside a single SECURITY DEFINER function under a
-- per-show advisory lock makes it atomic — every concurrent caller for the
-- same show simply queues behind the lock instead of racing.
--
-- Pad widths (3) mirror BRIDLE_NUMBER_PAD_WIDTH / ENTRY_NUMBER_PAD_WIDTH /
-- BACK_NUMBER_PAD_WIDTH in src/modules/shows/constants.ts — kept in sync by
-- hand, same as the permission-defaults pattern elsewhere in this schema.
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
    select count(*) into v_count from public.show_horses where show_id = v_class.show_id;
    v_bridle_number := lpad((v_show.starting_bridle_number + v_count)::text, 3, '0');
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
