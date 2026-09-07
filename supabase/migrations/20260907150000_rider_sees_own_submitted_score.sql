-- Legacy showed a rider their own scoresheet as soon as the judge SUBMITTED it.
-- handleScorecard (api/rider/[resource].js) gated on exactly two things:
--   * the entry belongs to the signed-in rider, and
--   * the score row is `submitted`
-- with an explicit comment that an unsubmitted sheet "is still the judge's
-- working copy". There was no results_published requirement anywhere in it.
--
-- Field-Arena only ever admitted a rider through `scores_select_own_published`,
-- which additionally requires classes.results_published. Verified live against
-- the demo rider before this migration: the same submitted score returned 0
-- rows with results_published = false and 1 row with it true. That is a real
-- behavioural difference — a rider who used to see their sheet the moment
-- judging finished had to wait for the organizer to publish standings.
--
-- Restoring legacy's rule as its own additive policy rather than by loosening
-- the existing one: RLS policies OR together, so `scores_select_own_published`
-- stays exactly as it is (it also covers the published-but-not-submitted case)
-- and this one adds back the "own + submitted" path legacy had.
--
-- Deliberately still narrower than the entry-ownership check alone: `submitted`
-- keeps a judge's in-progress working copy private, which legacy also did.

drop policy if exists scores_select_own_submitted on public.scores;
create policy scores_select_own_submitted on public.scores
  for select using (public.entry_is_own(entry_id) and submitted = true);
