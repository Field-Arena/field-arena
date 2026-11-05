-- Stable chart publish toggle precondition.
--
-- `toggle_status` flipped draft <-> published blind, so two people clicking
-- Publish at once flipped it twice and the chart ended up where it started.
-- The op now takes an optional `expect` ("draft" | "published") — the status
-- the caller saw — and raises the usual FA100 "the stable chart changed"
-- error when the stored status no longer matches. Without `expect` it behaves
-- as before.
--
-- Only stable_chart_apply_ops changes (body copied from
-- 20261002131000_shows_followups.sql, toggle_status branch extended). Same
-- signature, so the existing grants carry over. Re-runnable.
--
-- Operations (each an object with "op"):
--   toggle_status   {expect?}              draft <-> published; `expect` is the
--                                          status the caller saw
--   (all other ops unchanged — see 20261002131000_shows_followups.sql)

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
      -- Optional precondition: `expect` is the status the caller saw. Without
      -- it two people clicking at once flip the chart twice and cancel out.
      if jsonb_typeof(v_op->'expect') = 'string'
         and (case when v_chart->>'status' = 'published' then 'published' else 'draft' end)
             is distinct from (v_op->>'expect') then
        raise exception '%', v_changed using errcode = 'FA100';
      end if;
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
