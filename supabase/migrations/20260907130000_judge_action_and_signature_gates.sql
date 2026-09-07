-- Two rules legacy enforced at its own boundary that survived the port only in
-- application code, and so are reachable around it. Both restore legacy
-- behaviour exactly — nothing stricter, nothing looser.
--
-- 1. RIDE ACTIONS. Legacy gated scratch / disqualify / skip on three SEPARATE
--    permissions (api/shows/[id]/[resource].js:1327-1334 and :1471), and
--    deliberately did NOT gate `advance` ("normal scoring flow, not a ride-day
--    action"). class_entries_write ORs all four instead:
--
--      canEnterScores OR canScratch OR canSkip OR canEliminate
--
--    so holding any one grants all of them — a Scribe with only canEnterScores
--    can scratch and disqualify riders. RLS alone can't express "which action
--    is this", so the per-action rule goes in a trigger that inspects the
--    transition, the same shape as assert_scores_reopen_permission.
--
-- 2. SIGNATURES. Legacy refused the submit action outright for a Scribe
--    ("Scribes cannot sign a scoresheet -- the judge must sign it themselves",
--    :264). Field-Arena enforces that in submitScoresheet, but scores_write is
--    only canEnterScores — which Scribes have — so a Scribe can sign, and can
--    overwrite a judge's existing signature, by writing to the table directly.
--    assert_scores_reopen_permission guards only the value -> null direction
--    (reopen); this extends it to cover null -> value and value -> value.

-- ---------------------------------------------------------------------------
-- 1. Per-action ride permissions
-- ---------------------------------------------------------------------------
create or replace function public.assert_ride_action_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  show uuid := public.class_show_id(new.class_id);
begin
  -- Scratch: only on the transition INTO scratched, so ordinary scoring
  -- updates to an already-scratched row are not re-gated.
  if new.status = 'scratched' and old.status is distinct from 'scratched' then
    if not public.has_show_permission(show, 'canScratch') then
      raise exception 'You do not have permission to scratch a rider on this show.';
    end if;
  end if;

  if new.status = 'disqualified' and old.status is distinct from 'disqualified' then
    if not public.has_show_permission(show, 'canEliminate') then
      raise exception 'You do not have permission to eliminate/disqualify a rider on this show.';
    end if;
  end if;

  -- Skip is a ride_order swap here rather than its own verb. canEditShow is
  -- accepted alongside canSkip because the organizer-side draw reorder writes
  -- the same column and went through a different, show-manager-gated endpoint
  -- in legacy — gating it on canSkip alone would be STRICTER than legacy.
  if new.ride_order is distinct from old.ride_order then
    if not (
      public.has_show_permission(show, 'canSkip')
      or public.has_show_permission(show, 'canEditShow')
    ) then
      raise exception 'You do not have permission to reorder rides on this show.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists class_entries_action_permission_check on public.class_entries;
create trigger class_entries_action_permission_check
  before update on public.class_entries
  for each row execute function public.assert_ride_action_permission();

-- ---------------------------------------------------------------------------
-- 2. Signature integrity
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

  -- Applying or replacing a signature: only the judge holding THIS seat may do
  -- it. Matches legacy, where the signer was always derived from the caller's
  -- own seat and a Scribe was refused outright.
  if new.signed_by is distinct from old.signed_by and new.signed_by is not null then
    if not exists (
      select 1
      from public.class_panel p
      join public.staff_assignments sa on sa.id = p.judge_staff_id
      where p.class_id = new.class_id
        and p.seat_id = new.seat_id
        and (sa.user_id = auth.uid()
             or sa.email = (select email from public.users where id = auth.uid()))
    ) then
      raise exception 'Only the judge on this seat can sign this scoresheet.';
    end if;
  end if;

  return new;
end;
$$;
