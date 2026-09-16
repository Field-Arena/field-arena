-- class_entries_write ORs canEnterScores/canScratch/canSkip/canEliminate
-- together for the WHOLE row (20260805120000), and assert_ride_action_
-- permission (20260907130000) only narrows specific COLUMN TRANSITIONS
-- (status -> scratched/disqualified, ride_order) back down to their own
-- permission. Neither layer stops someone holding only canScratch (deliberately
-- withheld canEnterScores — the exact case 20260805120000's own header
-- describes: "a Show Admin or ShowStaff member can be trusted to scratch a
-- rider without ever being handed the scoresheet") from writing straight to
-- final_pct/judge_pct/correction/test_override in the same UPDATE, or in an
-- entirely separate one that never touches status at all — RLS's row-level
-- WITH CHECK has no column granularity on its own, and nothing here has ever
-- filled that gap.
--
-- All app-level writers of these columns (src/modules/scoring/data/mutations.ts)
-- already use the regular per-user server client, never the admin client
-- (confirmed), and no admin-client path anywhere in src/ ever UPDATEs these
-- four columns (checkout only ever sets correction/test_override on INSERT,
-- which this BEFORE UPDATE trigger does not touch) — so gating these columns
-- on canEnterScores here narrows exactly the intended gap without breaking
-- any existing write path.
create or replace function public.assert_class_entries_scoring_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  show uuid := public.class_show_id(new.class_id);
begin
  if (
    new.final_pct is distinct from old.final_pct
    or new.judge_pct is distinct from old.judge_pct
    or new.correction is distinct from old.correction
    or new.test_override is distinct from old.test_override
  ) then
    if not public.has_show_permission(show, 'canEnterScores') then
      raise exception 'You do not have permission to enter or edit scores on this show.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists class_entries_scoring_permission_check on public.class_entries;
create trigger class_entries_scoring_permission_check
  before update on public.class_entries
  for each row execute function public.assert_class_entries_scoring_permission();
