-- Append-only audit ledger.
--
-- Carried over from an earlier iteration of this schema that was applied
-- directly to the hosted project but never committed to the repository. The
-- design is kept as it was, because it is right: rows can only ever enter
-- through a SECURITY DEFINER trigger, and there is deliberately no INSERT,
-- UPDATE or DELETE policy on the table, so application code — even holding a
-- valid session — has no way to write or rewrite history.
--
-- This has no equivalent in the legacy Vercel/Drizzle schema, where mutations
-- left no trace beyond whatever Sentry happened to capture.

create table public.audit_log (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),

  -- Null when the mutation came from a service-role context (a cron job, a
  -- webhook) rather than a signed-in user, and on delete of the actor.
  actor_id uuid references auth.users (id) on delete set null,

  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,

  -- text, not uuid: audit_log covers tables whose primary key is a bigserial as
  -- well as those keyed by uuid.
  row_id text not null,

  before_data jsonb,
  after_data jsonb,

  -- Free-text justification, set by callers that have one to record (a refund
  -- reason, a disqualification note).
  reason text
);

create index audit_log_table_row_idx on public.audit_log (table_name, row_id);
create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id);

comment on table public.audit_log is
  'Append-only ledger of mutations on sensitive tables. Written only by audit_row_change(); no write policy exists.';

-- The generic trigger tables opt into. SECURITY DEFINER is what lets it insert
-- into a table the caller has no write policy for.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row_id text;
begin
  if tg_op = 'DELETE' then
    v_row_id := coalesce((old).id::text, '');
    insert into public.audit_log (actor_id, action, table_name, row_id, before_data, after_data)
    values (auth.uid(), 'delete', tg_table_name, v_row_id, to_jsonb(old), null);
    return old;
  elsif tg_op = 'UPDATE' then
    v_row_id := coalesce((new).id::text, '');
    insert into public.audit_log (actor_id, action, table_name, row_id, before_data, after_data)
    values (auth.uid(), 'update', tg_table_name, v_row_id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    v_row_id := coalesce((new).id::text, '');
    insert into public.audit_log (actor_id, action, table_name, row_id, before_data, after_data)
    values (auth.uid(), 'insert', tg_table_name, v_row_id, null, to_jsonb(new));
    return new;
  end if;
end;
$$;

comment on function public.audit_row_change() is
  'Generic INSERT/UPDATE/DELETE audit trigger. Attach per table — see the final migration.';
