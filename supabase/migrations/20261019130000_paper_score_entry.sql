-- Paper score sheets, typed in by the show office. Re-runnable.
-- NOT applied anywhere yet — apply to a non-production Supabase project and
-- test before production.
--
-- The offline backup for venues with no signal: judges score on printed
-- sheets (/dashboard/score-sheets), and once back online show management
-- types each finished, signed sheet in on /dashboard/scoring/<class>/paper.
--
-- Live scoring's rules don't fit that: only the rider in the ring can be
-- scored, and only the judge on a seat can sign it. For paper entry the
-- sheets arrive in any order and the judge signed on paper. So:
--
--   * Paper entry is show management only (canEditShow on the class's show)
--     and only while live scoring is CLOSED for that class
--     (classes.scoring_open = false). A class being run live keeps every
--     live rule.
--   * A paper-entered score row is flagged (scores.entered_from_paper) and
--     records who typed it (scores.entered_by). Only management can set the
--     flag, and only as themselves.
--   * Management may sign a paper row on the judge's behalf (signed_by is
--     the judge's name from the panel; entered_by says who typed it).
--   * Management may mark a ride scored out of running order while the
--     class is closed.
-- Everything else still applies: a sheet must be complete to be signed, and
-- nothing changes once results are published.
--
-- Also fixes a gap found while building this: the "only the judge on this
-- seat can sign" check (assert_scores_reopen_permission) ran on UPDATE only,
-- so a scribe could INSERT a brand-new score row that was already signed.

alter table public.scores
  add column if not exists entered_from_paper boolean not null default false,
  add column if not exists entered_by uuid references auth.users (id) on delete set null;

comment on column public.scores.entered_from_paper is
  'Typed in by show management from a signed paper score sheet (20261019130000).';
comment on column public.scores.entered_by is
  'Who typed in a paper score sheet. Null for live scoring.';

-- Is this class closed to live scoring and the caller show management?
-- Definer so the invoker triggers below can read classes regardless of RLS.
create or replace function public.can_enter_paper_scores(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and not coalesce(c.scoring_open, false)
      and public.has_show_permission(c.show_id, 'canEditShow')
  );
$$;

revoke execute on function public.can_enter_paper_scores(uuid) from public, anon;
grant execute on function public.can_enter_paper_scores(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Signing (UPDATE): supersedes 20261019120000 — adds the paper branch.
-- ---------------------------------------------------------------------------
create or replace function public.assert_scores_reopen_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  show uuid := public.class_show_id(new.class_id);
begin
  -- Clearing a signature = reopening. Unchanged from the original.
  if old.signed_by is not null and new.signed_by is null then
    if not public.has_show_permission(show, 'canEditShow') then
      raise exception 'not authorized to reopen a signed scoresheet';
    end if;
    return new;
  end if;

  -- Applying or replacing a signature: the judge holding THIS seat, or show
  -- management recording a signed paper sheet while live scoring is closed.
  if new.signed_by is distinct from old.signed_by and new.signed_by is not null then
    if coalesce(new.entered_from_paper, false)
       and public.can_enter_paper_scores(new.class_id) then
      return new;
    end if;
    if not exists (
      select 1
      from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = new.class_id
        and p.seat_id = new.seat_id
        and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
    ) then
      raise exception 'Only the judge on this seat can sign this scoresheet.';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.assert_scores_reopen_permission() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signing (INSERT) and the paper flag
-- ---------------------------------------------------------------------------
-- Inserting a row that is already signed is the same act as signing it.
-- And entered_from_paper / entered_by can only be set by management for
-- themselves, or a scribe could flag a row as "paper" to slip past the seat
-- check above.
create or replace function public.assert_score_insert_signature_and_paper()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Service role, migrations, cron: already checked by the caller.
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' or new.entered_from_paper is distinct from old.entered_from_paper
     or new.entered_by is distinct from old.entered_by then
    if coalesce(new.entered_from_paper, false) or new.entered_by is not null then
      if not public.can_enter_paper_scores(new.class_id) then
        raise exception 'Only show management can enter paper score sheets, and only while live scoring is closed for this class.'
          using errcode = '42501';
      end if;
      if new.entered_by is distinct from auth.uid() then
        raise exception 'A paper score sheet must be recorded as entered by you.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  if tg_op = 'INSERT' and (new.signed_by is not null or coalesce(new.submitted, false)) then
    if coalesce(new.entered_from_paper, false) then
      -- Checked above: management, class closed.
      return new;
    end if;
    if not exists (
      select 1
      from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = new.class_id
        and p.seat_id = new.seat_id
        and (sa.user_id = auth.uid() or lower(sa.email) = public.auth_verified_email())
    ) then
      raise exception 'Only the judge on this seat can sign this scoresheet.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.assert_score_insert_signature_and_paper() from public, anon, authenticated;

drop trigger if exists scores_insert_signature_and_paper_check on public.scores;
create trigger scores_insert_signature_and_paper_check
  before insert or update on public.scores
  for each row execute function public.assert_score_insert_signature_and_paper();

-- ---------------------------------------------------------------------------
-- Ride order: supersedes 20261018123000 — management may finish rides out
-- of running order while live scoring is closed (paper sheets come in any
-- order). A class being scored live keeps the ride-in-the-ring rule.
-- ---------------------------------------------------------------------------
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
     and public.class_ride_in_ring(new.class_id) is distinct from new.id
     and not public.can_enter_paper_scores(new.class_id) then
    raise exception 'Only the rider in the ring can be scored. Work this rider in first to score them out of order.'
      using errcode = 'FA022';
  end if;
  return new;
end;
$$;
