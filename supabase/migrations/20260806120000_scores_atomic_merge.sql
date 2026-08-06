-- Live scoring writes one mark at a time into scores.movements/collectives —
-- jsonb columns holding every movement/collective for the whole ride, keyed
-- by number. A judge filling out a sheet quickly fires several of these in
-- close succession, and modules/scoring/data/mutations.ts's own
-- read-then-merge-then-replace (fetch the row, merge the new key into the
-- JS object, upsert the whole column back) is not atomic: two writes to
-- different keys can each read the row before the other's write lands, and
-- whichever commits last silently drops the other's mark. This is exactly
-- the kind of data loss this schema's own "real competition results, not
-- recoverable" design goal exists to prevent.
--
-- merge_score_json does the read-modify-write as a single atomic UPDATE
-- (jsonb `||` concatenation), so concurrent writes to different keys in the
-- same column can no longer clobber each other. security invoker (the
-- default) — RLS on public.scores still applies exactly as it does for any
-- other write through this table; this is not a privilege escalation.
create or replace function public.merge_score_json(
  p_class_id uuid,
  p_entry_id uuid,
  p_seat_id text,
  p_field text,
  p_patch jsonb
)
returns void
language plpgsql
as $$
begin
  if p_field not in ('movements', 'collectives', 'remarks', 'error_at') then
    raise exception 'merge_score_json: invalid field %', p_field;
  end if;

  insert into public.scores (class_id, entry_id, seat_id)
  values (p_class_id, p_entry_id, p_seat_id)
  on conflict (entry_id, seat_id) do nothing;

  execute format(
    'update public.scores set %1$I = coalesce(%1$I, ''{}''::jsonb) || $1, updated_at = now() where entry_id = $2 and seat_id = $3',
    p_field
  ) using p_patch, p_entry_id, p_seat_id;
end;
$$;

grant execute on function public.merge_score_json to authenticated;
