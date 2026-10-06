-- Shows follow-ups from docs/audit/2026-10-02-after-audit.md.
--
--   H18  stable_chart, shows.manual_horses and horses.document_uploads were
--        read-modify-write from the app: two people editing at once silently
--        lost one change. Each write is now a single UPDATE that patches the
--        stored jsonb in place, so concurrent edits serialize on the row lock
--        and each one is applied to the latest value.
--   Reconcile  filing-cabinet numbering ran one RPC per unlinked entry on
--        every page load; reconcile_show_entry_numbering does the whole show
--        in one call.
--   Delete races  removing a class checked "no entries" and then deleted in a
--        second request, so an entry inserted in between was cascaded away.
--        delete_show_classes_if_unentered locks the classes first and checks
--        and deletes in one transaction.
--
-- The H18 and delete functions are SECURITY INVOKER: RLS on shows / horses /
-- classes (and the horses / classes write triggers) still decide who may
-- write, exactly as for the direct UPDATE/DELETE they replace. Every
-- statement is re-runnable.

-- ---------------------------------------------------------------------------
-- H18 — stable_chart
-- ---------------------------------------------------------------------------

-- Same rule as normalizeStall() in stable-chart-queries.ts: charts saved
-- before the status enum only carry `closed` / `horseId`.
create or replace function public.stable_chart_stall_status(p_stall jsonb)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_stall->>'status' in ('available', 'occupied', 'reserved', 'unusable', 'tack', 'hold')
      then p_stall->>'status'
    when p_stall->'closed' = 'true'::jsonb then 'unusable'
    when coalesce(nullif(p_stall->>'horseId', ''), nullif(p_stall->>'horseName', '')) is not null
      then 'occupied'
    else 'available'
  end;
$$;

-- A stall field as normalizeStall() would read it: missing or json null
-- becomes the default.
create or replace function public.stable_chart_field(p_obj jsonb, p_key text, p_default jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_obj -> p_key is null or jsonb_typeof(p_obj -> p_key) = 'null' then p_default
    else p_obj -> p_key
  end;
$$;

-- The horse-related fields of a stall, defaulted like normalizeStall().
create or replace function public.stable_chart_horse_fields(p_stall jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'horseId', public.stable_chart_field(p_stall, 'horseId', 'null'::jsonb),
    'horseName', public.stable_chart_field(p_stall, 'horseName', 'null'::jsonb),
    'riderName', public.stable_chart_field(p_stall, 'riderName', 'null'::jsonb),
    'trainerName', public.stable_chart_field(p_stall, 'trainerName', 'null'::jsonb),
    'isStallion', public.stable_chart_field(p_stall, 'isStallion', 'false'::jsonb),
    'shavings', public.stable_chart_field(p_stall, 'shavings', '0'::jsonb)
  );
$$;

create or replace function public.stable_chart_stable_index(p_chart jsonb, p_stable_id text)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select (e.ord - 1)::integer
  from jsonb_array_elements(
    case when jsonb_typeof(p_chart->'stables') = 'array' then p_chart->'stables' else '[]'::jsonb end
  ) with ordinality as e(s, ord)
  where e.s->>'id' = p_stable_id
  order by e.ord
  limit 1;
$$;

create or replace function public.stable_chart_stall_index(
  p_chart jsonb,
  p_stable_index integer,
  p_stall_id text
)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select (e.ord - 1)::integer
  from jsonb_array_elements(
    case
      when jsonb_typeof(p_chart->'stables'->p_stable_index->'stalls') = 'array'
        then p_chart->'stables'->p_stable_index->'stalls'
      else '[]'::jsonb
    end
  ) with ordinality as e(s, ord)
  where e.s->>'id' = p_stall_id
  order by e.ord
  limit 1;
$$;

-- Applies a list of edit operations to a stable chart value and returns the
-- new value. Pure apart from gen_random_uuid(); raises SQLSTATE FA100 with a
-- user-facing message when an operation's precondition fails.
--
-- Operations (each an object with "op"):
--   toggle_status                          draft <-> published
--   resize_stables  {count}                drop trailing stables (refused if any
--                                          still has a horse) / append empty ones
--   append_stables  {stables}              append these stable objects
--   patch_stable    {stableId, set}        merge `set` into the stable
--   resize_stalls   {stableId, stallCount?} resizeStableStalls() on that stable
--   patch_stall     {stableId, stallId, set, expect?, required?}
--                   merge `set` into the stall; `expect` maps a key to the value
--                   the stall must still hold (key "status" uses the derived
--                   status), otherwise the chart changed underneath the caller
--   set_stall_status {stableId, stallId, status, reason}
--   move_stall      {fromStableId, fromStallId, toStableId, toStallId}
--   swap_stalls     {stableAId, stallAId, stableBId, stallBId}
create or replace function public.stable_chart_apply_ops(p_chart jsonb, p_ops jsonb)
returns jsonb
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  v_chart jsonb := case when jsonb_typeof(p_chart) = 'object' then p_chart else '{}'::jsonb end;
  v_op jsonb;
  v_stables jsonb;
  v_si integer;
  v_ti integer;
  v_si2 integer;
  v_ti2 integer;
  v_stall jsonb;
  v_stall2 jsonb;
  v_stable jsonb;
  v_count integer;
  v_len integer;
  v_names text;
  v_n integer;
  v_key text;
  v_expected jsonb;
  v_actual jsonb;
  v_status text;
  v_clear constant jsonb := jsonb_build_object(
    'horseId', null, 'horseName', null, 'riderName', null, 'trainerName', null,
    'shavings', 0, 'isStallion', false
  );
  v_changed constant text := 'The stable chart changed while you were editing — please try again.';
begin
  if jsonb_typeof(v_chart->'stables') is distinct from 'array' then
    v_chart := jsonb_set(v_chart, '{stables}', '[]'::jsonb, true);
  end if;

  for v_op in select value from jsonb_array_elements(coalesce(p_ops, '[]'::jsonb)) loop
    case v_op->>'op'

    when 'toggle_status' then
      v_chart := jsonb_set(
        v_chart, '{status}',
        to_jsonb(case when v_chart->>'status' = 'published' then 'draft' else 'published' end),
        true
      );

    when 'resize_stables' then
      v_count := greatest(0, (v_op->>'count')::integer);
      v_stables := v_chart->'stables';
      v_len := jsonb_array_length(v_stables);

      select string_agg(coalesce(s->>'name', ''), ', ' order by ord), count(*)
        into v_names, v_n
      from jsonb_array_elements(v_stables) with ordinality as e(s, ord)
      where ord > v_count
        and exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(s->'stalls') = 'array' then s->'stalls' else '[]'::jsonb end
          ) st
          where coalesce(nullif(st->>'horseId', ''), nullif(st->>'horseName', '')) is not null
        );
      if v_n > 0 then
        raise exception '% still % horses assigned — unassign them before lowering the stable count.',
          v_names, case when v_n = 1 then 'has' else 'have' end
          using errcode = 'FA100';
      end if;

      select coalesce(jsonb_agg(s order by ord), '[]'::jsonb) into v_stables
      from jsonb_array_elements(v_stables) with ordinality as e(s, ord)
      where ord <= v_count;

      for v_n in v_len + 1 .. v_count loop
        v_stables := v_stables || jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid()::text,
          'name', 'Stable ' || v_n::text,
          'stallCount', 0,
          'rowCount', 1,
          'stalls', '[]'::jsonb
        ));
      end loop;
      v_chart := jsonb_set(v_chart, '{stables}', v_stables);

    when 'append_stables' then
      if jsonb_typeof(v_op->'stables') = 'array' then
        v_chart := jsonb_set(v_chart, '{stables}', (v_chart->'stables') || (v_op->'stables'));
      end if;

    when 'patch_stable' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'stableId');
      if v_si is not null and jsonb_typeof(v_op->'set') = 'object' then
        v_chart := jsonb_set(
          v_chart, array['stables', v_si::text],
          (v_chart->'stables'->v_si) || (v_op->'set')
        );
      end if;

    when 'resize_stalls' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'stableId');
      if v_si is not null then
        v_stable := v_chart->'stables'->v_si;
        v_count := coalesce(
          (v_op->>'stallCount')::integer,
          (public.stable_chart_field(v_stable, 'stallCount', '0'::jsonb)#>>'{}')::numeric::integer
        );
        v_stables := '[]'::jsonb;
        for v_n in 1 .. greatest(0, v_count) loop
          v_stall := case
            when jsonb_typeof(v_stable->'stalls') = 'array' then v_stable->'stalls'->(v_n - 1)
          end;
          if v_stall is not null and jsonb_typeof(v_stall) = 'object' then
            v_stall := v_stall || jsonb_build_object('number', v_n);
          else
            v_stall := jsonb_build_object(
              'id', gen_random_uuid()::text, 'number', v_n, 'label', v_n::text,
              'horseId', null, 'horseName', null, 'riderName', null, 'trainerName', null,
              'shavings', 0, 'status', 'available', 'statusReason', null, 'note', null,
              'isStallion', false
            );
          end if;
          v_stables := v_stables || jsonb_build_array(v_stall);
        end loop;
        v_chart := jsonb_set(
          v_chart, array['stables', v_si::text],
          v_stable || jsonb_build_object('stallCount', v_count, 'stalls', v_stables)
        );
      end if;

    when 'patch_stall' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'stableId');
      v_ti := case when v_si is not null
        then public.stable_chart_stall_index(v_chart, v_si, v_op->>'stallId') end;
      if v_ti is null then
        if coalesce((v_op->>'required')::boolean, false) then
          raise exception 'Stall not found.' using errcode = 'FA100';
        end if;
        continue;
      end if;
      v_stall := v_chart->'stables'->v_si->'stalls'->v_ti;

      if jsonb_typeof(v_op->'expect') = 'object' then
        for v_key, v_expected in select key, value from jsonb_each(v_op->'expect') loop
          v_actual := case
            when v_key = 'status' then to_jsonb(public.stable_chart_stall_status(v_stall))
            else public.stable_chart_field(v_stall, v_key, 'null'::jsonb)
          end;
          if v_actual is distinct from v_expected then
            raise exception '%', v_changed using errcode = 'FA100';
          end if;
        end loop;
      end if;

      if jsonb_typeof(v_op->'set') = 'object' then
        v_chart := jsonb_set(
          v_chart, array['stables', v_si::text, 'stalls', v_ti::text],
          v_stall || (v_op->'set')
        );
      end if;

    when 'set_stall_status' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'stableId');
      v_ti := case when v_si is not null
        then public.stable_chart_stall_index(v_chart, v_si, v_op->>'stallId') end;
      if v_ti is null then
        continue;
      end if;
      v_stall := v_chart->'stables'->v_si->'stalls'->v_ti;
      v_status := v_op->>'status';
      v_stall2 := v_stall || jsonb_build_object(
        'status', v_status,
        'statusReason', public.stable_chart_field(v_op, 'reason', 'null'::jsonb)
      );
      if v_status <> 'available' and public.stable_chart_stall_status(v_stall) = 'occupied' then
        v_stall2 := v_stall2 || v_clear;
      end if;
      v_chart := jsonb_set(v_chart, array['stables', v_si::text, 'stalls', v_ti::text], v_stall2);

    when 'move_stall' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'fromStableId');
      v_ti := case when v_si is not null
        then public.stable_chart_stall_index(v_chart, v_si, v_op->>'fromStallId') end;
      v_si2 := public.stable_chart_stable_index(v_chart, v_op->>'toStableId');
      v_ti2 := case when v_si2 is not null
        then public.stable_chart_stall_index(v_chart, v_si2, v_op->>'toStallId') end;
      if v_ti is null or v_ti2 is null then
        raise exception 'Stall not found.' using errcode = 'FA100';
      end if;
      v_stall := v_chart->'stables'->v_si->'stalls'->v_ti;
      v_stall2 := v_chart->'stables'->v_si2->'stalls'->v_ti2;
      if public.stable_chart_stall_status(v_stall2) <> 'available' then
        raise exception 'That stall is not available.' using errcode = 'FA100';
      end if;

      v_chart := jsonb_set(
        v_chart, array['stables', v_si2::text, 'stalls', v_ti2::text],
        v_stall2
          || public.stable_chart_horse_fields(v_stall)
          || jsonb_build_object('status', 'occupied', 'statusReason', null)
      );
      -- Re-read: when from and to are the same stall the clear below must
      -- apply on top of the write above, as the in-memory version did.
      v_stall := v_chart->'stables'->v_si->'stalls'->v_ti;
      v_chart := jsonb_set(
        v_chart, array['stables', v_si::text, 'stalls', v_ti::text],
        v_stall || v_clear || jsonb_build_object('status', 'available')
      );

    when 'swap_stalls' then
      v_si := public.stable_chart_stable_index(v_chart, v_op->>'stableAId');
      v_ti := case when v_si is not null
        then public.stable_chart_stall_index(v_chart, v_si, v_op->>'stallAId') end;
      v_si2 := public.stable_chart_stable_index(v_chart, v_op->>'stableBId');
      v_ti2 := case when v_si2 is not null
        then public.stable_chart_stall_index(v_chart, v_si2, v_op->>'stallBId') end;
      if v_ti is null or v_ti2 is null then
        raise exception 'Stall not found.' using errcode = 'FA100';
      end if;
      v_stall := v_chart->'stables'->v_si->'stalls'->v_ti;
      v_stall2 := v_chart->'stables'->v_si2->'stalls'->v_ti2;
      if public.stable_chart_stall_status(v_stall) <> 'occupied'
         or public.stable_chart_stall_status(v_stall2) <> 'occupied' then
        raise exception 'Both stalls must be occupied to swap.' using errcode = 'FA100';
      end if;

      -- v_stall / v_stall2 hold both stalls' pre-swap values.
      v_chart := jsonb_set(
        v_chart, array['stables', v_si::text, 'stalls', v_ti::text],
        v_stall || public.stable_chart_horse_fields(v_stall2)
      );
      v_chart := jsonb_set(
        v_chart, array['stables', v_si2::text, 'stalls', v_ti2::text],
        (v_chart->'stables'->v_si2->'stalls'->v_ti2) || public.stable_chart_horse_fields(v_stall)
      );

    else
      raise exception 'Unknown stable chart operation: %', v_op->>'op';
    end case;
  end loop;

  return v_chart;
end;
$$;

-- Entry point for the app. One UPDATE, so the chart is read and written
-- under the row lock: a concurrent edit is applied on top, never lost.
-- Returns false when RLS hid the row (no permission / no such show).
create or replace function public.apply_stable_chart_ops(p_show_id uuid, p_ops jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  update public.shows
     set stable_chart = public.stable_chart_apply_ops(stable_chart, p_ops)
   where id = p_show_id;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- H18 — shows.manual_horses
-- ---------------------------------------------------------------------------
create or replace function public.append_show_manual_horse(p_show_id uuid, p_entry jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  update public.shows
     set manual_horses =
       (case when jsonb_typeof(manual_horses) = 'array' then manual_horses else '[]'::jsonb end)
       || jsonb_build_array(p_entry)
   where id = p_show_id;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- H18 — horses.document_uploads
-- ---------------------------------------------------------------------------
-- Patches the upload(s) for one requirement in place: drops `p_unset` keys,
-- then merges `p_set`. Other uploads are untouched. Returns false when RLS
-- hid the horse row.
create or replace function public.patch_horse_document_upload(
  p_horse_id uuid,
  p_requirement_id text,
  p_set jsonb,
  p_unset text[] default '{}'
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  update public.horses
     set document_uploads = coalesce(
       (
         select jsonb_agg(
           case
             when jsonb_typeof(u) = 'object' and u->>'requirementId' = p_requirement_id
               then (u - coalesce(p_unset, '{}'::text[])) || coalesce(p_set, '{}'::jsonb)
             else u
           end
           order by ord
         )
         from jsonb_array_elements(document_uploads) with ordinality as e(u, ord)
       ),
       '[]'::jsonb
     )
   where id = p_horse_id
     and jsonb_typeof(document_uploads) = 'array';
  if found then
    return true;
  end if;
  -- No array stored (nothing to patch): still report whether the row is
  -- visible/writable so the caller can tell "no permission" apart.
  perform 1 from public.horses where id = p_horse_id;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Filing-cabinet reconcile — one call per show
-- ---------------------------------------------------------------------------
-- Runs resolve_show_entry_numbering for every class entry in the show that
-- isn't linked to a show entry yet. Service role only, like the per-row
-- function (the app checks canManageEntryLedger before calling it).
create or replace function public.reconcile_show_entry_numbering(p_show_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select ce.id
    from public.class_entries ce
    join public.classes c on c.id = ce.class_id
    where c.show_id = p_show_id
      and ce.show_entry_id is null
    order by ce.id
  loop
    perform public.resolve_show_entry_numbering(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Delete classes only while nobody has entered them
-- ---------------------------------------------------------------------------
-- Locks the classes first (FOR UPDATE conflicts with the FOR KEY SHARE lock a
-- class_entries insert takes on its class), then counts entries with a fresh
-- snapshot and deletes in the same transaction. An entry committed before
-- the lock is seen and blocks the delete; one attempted after it waits and
-- then fails its foreign key instead of being cascaded away.
--
-- All-or-nothing: if any of the classes has an entry (scratched ones count —
-- the delete would cascade them and their payment trail too), nothing is
-- deleted. Returns {"deleted": n, "blocked": classes_with_entries}.
create or replace function public.delete_show_classes_if_unentered(
  p_show_id uuid,
  p_class_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_ids uuid[];
  v_blocked integer;
  v_deleted integer;
begin
  select coalesce(array_agg(id order by id), '{}')
    into v_ids
  from (
    select id
    from public.classes
    where show_id = p_show_id
      and id = any(coalesce(p_class_ids, '{}'::uuid[]))
    order by id
    for update
  ) locked;

  if cardinality(v_ids) = 0 then
    return jsonb_build_object('deleted', 0, 'blocked', 0);
  end if;

  select count(distinct class_id)
    into v_blocked
  from public.class_entries
  where class_id = any(v_ids);

  if v_blocked > 0 then
    return jsonb_build_object('deleted', 0, 'blocked', v_blocked);
  end if;

  delete from public.classes
   where show_id = p_show_id
     and id = any(v_ids)
     and not exists (select 1 from public.class_entries e where e.class_id = classes.id);
  get diagnostics v_deleted = row_count;

  return jsonb_build_object('deleted', v_deleted, 'blocked', 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (Supabase grants EXECUTE to anon/authenticated directly)
-- ---------------------------------------------------------------------------
revoke execute on function public.stable_chart_apply_ops(jsonb, jsonb) from public, anon;
revoke execute on function public.stable_chart_horse_fields(jsonb) from public, anon;
revoke execute on function public.apply_stable_chart_ops(uuid, jsonb) from public, anon;
revoke execute on function public.append_show_manual_horse(uuid, jsonb) from public, anon;
revoke execute on function public.patch_horse_document_upload(uuid, text, jsonb, text[])
  from public, anon;
revoke execute on function public.delete_show_classes_if_unentered(uuid, uuid[]) from public, anon;
revoke execute on function public.reconcile_show_entry_numbering(uuid)
  from public, anon, authenticated;

grant execute on function public.stable_chart_apply_ops(jsonb, jsonb) to authenticated, service_role;
grant execute on function public.stable_chart_horse_fields(jsonb) to authenticated, service_role;
grant execute on function public.apply_stable_chart_ops(uuid, jsonb) to authenticated, service_role;
grant execute on function public.append_show_manual_horse(uuid, jsonb) to authenticated, service_role;
grant execute on function public.patch_horse_document_upload(uuid, text, jsonb, text[])
  to authenticated, service_role;
grant execute on function public.delete_show_classes_if_unentered(uuid, uuid[])
  to authenticated, service_role;
grant execute on function public.reconcile_show_entry_numbering(uuid) to service_role;
