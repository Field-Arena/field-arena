-- Seat ownership on a scoresheet, enforced at the database.
--
-- Legacy refused this server-side (api/shows/[id]/[resource].js:1194-1201):
--
--   const seatIsMine = seat && staffAssignmentId &&
--     (seat.judgeStaffId === staffAssignmentId || seat.scribeStaffId === staffAssignmentId);
--   if (!seatIsMine) -> 403 'You are not assigned to that seat on this class.'
--
-- Field-Arena enforced it only in assertSeatAccess() inside a Server Action.
-- The scores_write policy checks nothing but canEnterScores, which Judge and
-- Scribe both hold by default, so a direct PostgREST write walked straight past
-- it. Reproduced before writing this: the demo scribe (Tom Reyes, scribe on J1
-- of class 2ebeaef7…) successfully UPDATEd seat J2's row — a seat belonging to
-- two entirely different people — and set final_remarks on it.
--
-- 20260907140000's trigger does not cover this. It resolves the caller's role
-- for the seat and then does `if caller is distinct from 'scribe' then return
-- new`, so a caller with NO relationship to the seat resolves to null and
-- returns early — allowed. That trigger is about judge-mark precedence for a
-- scribe on their own seat; this one is about whether the seat is yours at all.
-- Added alongside it rather than folded into it: they answer different
-- questions and each stays readable on its own.
--
-- Two things this is careful NOT to do, both of which would be stricter than
-- legacy:
--
--   * Organizer / Show Admin / SuperAdmin still bypass. They are not
--     class_panel rows at all, and legacy scoped its check to isStaffLevel for
--     exactly this reason. Same canEditShow bypass assert_scribe_mark_precedence
--     already uses.
--
--   * A person may hold several seats on one class. scores_seat_role() answers
--     "is THIS seat mine" for the specific seat_id passed to it, so holding J1
--     and J3 grants both and nothing else. Deliberately not keyed off anything
--     that resolves a caller's single seat — the app-layer assertSeatAccess()
--     compares against getMySeat(), which returns only the first match and is
--     therefore stricter than legacy for a multi-seat judge. That is a separate
--     app-layer bug; this trigger does not inherit it.
--
-- INSERT and UPDATE are both covered: creating a fresh row under someone else's
-- seat is the same act as editing theirs. DELETE is intentionally left alone —
-- no application path deletes a scores row, and legacy had no delete action to
-- match.

create or replace function public.assert_scores_seat_ownership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Whole-show managers are not seats; nothing to enforce for them.
  if public.has_show_permission(public.class_show_id(new.class_id), 'canEditShow') then
    return new;
  end if;

  if public.scores_seat_role(new.class_id, new.seat_id) is null then
    raise exception 'You are not assigned to that seat on this class.';
  end if;

  return new;
end;
$$;

drop trigger if exists scores_seat_ownership_check on public.scores;
create trigger scores_seat_ownership_check
  before insert or update on public.scores
  for each row execute function public.assert_scores_seat_ownership();
