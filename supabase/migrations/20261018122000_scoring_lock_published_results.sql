-- Published results are frozen. Re-runnable.
--
-- Stress test 2026-10-17 (#18): after a class's results were published a
-- judge changed a mark to 0 and un-signed the sheet, while the published
-- result still showed 70% — the published score and the scoresheet behind
-- it no longer agreed, and nothing recorded why.
--
-- While classes.results_published is true:
--   scores         no insert, update or delete (marks, errors, remarks,
--                  signatures, reopening).
--   class_entries  the result columns (status, advanced_past, final_pct,
--                  judge_pct, collective_total, finalized_at, test_override)
--                  can't change. The free-text correction note stays
--                  editable so management can still annotate a result.
-- To correct a published class, someone with canPublishShow unpublishes it
-- first (assert_classes_write_permission already limits that), fixes it and
-- publishes again. Trusted roles (service role, migrations) are not limited.

-- public.class_results_published(class_id) (20260727121300, security
-- definer) reads classes.results_published regardless of the caller's RLS.
-- It is reused as-is: a public select policy depends on it, so its grants
-- stay untouched.

create or replace function public.assert_scores_not_published()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() then
    return coalesce(new, old);
  end if;

  if public.class_results_published(coalesce(new.class_id, old.class_id))
     or (tg_op = 'UPDATE' and public.class_results_published(old.class_id)) then
    raise exception 'Results for this class are published. Ask show management to unpublish them before changing scores.'
      using errcode = 'FA020';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists scores_published_locked on public.scores;
create trigger scores_published_locked
  before insert or update or delete on public.scores
  for each row execute function public.assert_scores_not_published();

create or replace function public.assert_class_entry_results_not_published()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_db_role() then
    return new;
  end if;

  if (
       new.status is distinct from old.status
       or new.advanced_past is distinct from old.advanced_past
       or new.final_pct is distinct from old.final_pct
       or new.judge_pct is distinct from old.judge_pct
       or new.collective_total is distinct from old.collective_total
       or new.finalized_at is distinct from old.finalized_at
       or new.test_override is distinct from old.test_override
       or new.class_id is distinct from old.class_id
     )
     and (
       public.class_results_published(old.class_id)
       or public.class_results_published(new.class_id)
     ) then
    raise exception 'Results for this class are published. Ask show management to unpublish them before changing a ride.'
      using errcode = 'FA020';
  end if;
  return new;
end;
$$;

drop trigger if exists class_entries_published_locked on public.class_entries;
create trigger class_entries_published_locked
  before update on public.class_entries
  for each row execute function public.assert_class_entry_results_not_published();
