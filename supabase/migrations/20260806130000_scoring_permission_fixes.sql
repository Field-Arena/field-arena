-- Judge/scoring module parity fixes: several RLS policies gate writes on a
-- different permission than legacy required for the same action (or, for
-- scoresheet reopening, on no app-level check at all — this schema has no
-- Express-style action dispatch to hang a per-action check on, so the
-- distinction has to live in Postgres). Legacy source: the various
-- `hasStaffPermission(user, showId, '...')` checks in
-- `api/shows/[id]/[resource].js`'s action handlers.
--
-- Column-transition-specific checks (a `classes` update can be a
-- scoring-open toggle, a work-in change, a publish, or a general edit, each
-- needing a different permission) can't be expressed in a plain USING/CHECK
-- clause — those only see one side of the row (existing vs proposed), never
-- both at once. A BEFORE trigger comparing OLD and NEW is the only tool for
-- that, so this follows the same before-trigger pattern already established
-- by `assert_dq_has_reason` (20260727120700_scoring.sql).

-- ---------------------------------------------------------------------------
-- classes: scoring-open toggle / work-in / publish each need a different
-- permission than the blanket canEditShow the base policy currently checks.
-- ---------------------------------------------------------------------------

create or replace function public.assert_classes_write_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_j jsonb := to_jsonb(old);
  new_j jsonb := to_jsonb(new);
begin
  -- Only scoring_open changed: legacy's toggleClass has no permission check
  -- at all beyond being a participant on the show.
  if (old_j - 'scoring_open') = (new_j - 'scoring_open') then
    if not public.can_view_show(new.show_id) then
      raise exception 'not authorized to change scoring status for this class';
    end if;
    return new;
  end if;

  -- Only working_in_entry_id changed: legacy's workIn requires
  -- canManageHoldingQueue, same as holdingAdd/holdingRemove.
  if (old_j - 'working_in_entry_id') = (new_j - 'working_in_entry_id') then
    if not public.has_show_permission(new.show_id, 'canManageHoldingQueue') then
      raise exception 'not authorized to manage the holding queue for this class';
    end if;
    return new;
  end if;

  -- Only results_published(_at) changed: legacy's publish/unpublish
  -- requires canPublishShow specifically, not canEditShow.
  if (old_j - 'results_published' - 'results_published_at')
     = (new_j - 'results_published' - 'results_published_at') then
    if not public.has_show_permission(new.show_id, 'canPublishShow') then
      raise exception 'not authorized to publish results for this class';
    end if;
    return new;
  end if;

  -- Anything else: general class edit, still requires canEditShow.
  if not public.has_show_permission(new.show_id, 'canEditShow') then
    raise exception 'not authorized to edit this class';
  end if;
  return new;
end;
$$;

drop trigger if exists classes_write_permission_check on public.classes;
create trigger classes_write_permission_check
  before update on public.classes
  for each row execute function public.assert_classes_write_permission();

-- Splits the old single `for all` policy so only UPDATE relaxes to "any
-- participant" (the trigger above does the fine-grained enforcement per
-- column changed) — INSERT/DELETE (creating/removing a class outright) are
-- untouched by this parity pass and keep requiring canEditShow, same as
-- today.
drop policy if exists classes_write on public.classes;

create policy classes_insert on public.classes
  for insert with check (public.has_show_permission(show_id, 'canEditShow'));

create policy classes_delete on public.classes
  for delete using (public.has_show_permission(show_id, 'canEditShow'));

create policy classes_update on public.classes
  for update using (public.can_view_show(show_id))
  with check (public.can_view_show(show_id));

-- ---------------------------------------------------------------------------
-- scores: reopening a signed sheet (clearing signed_by/signed_at) requires
-- canEditShow. A judge/scribe editing their own not-yet-locked sheet, which
-- also flips submitted back to false but leaves signed_by/signed_at alone,
-- is a completely different, ungated legacy path (api/shows/[id]/
-- [resource].js:1234-1262) and must not be caught by this check.
-- ---------------------------------------------------------------------------

create or replace function public.assert_scores_reopen_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.signed_by is not null and new.signed_by is null then
    if not public.has_show_permission(public.class_show_id(new.class_id), 'canEditShow') then
      raise exception 'not authorized to reopen a signed scoresheet';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists scores_reopen_permission_check on public.scores;
create trigger scores_reopen_permission_check
  before update on public.scores
  for each row execute function public.assert_scores_reopen_permission();

-- ---------------------------------------------------------------------------
-- class_entries: adding to or removing from the holding queue requires
-- canManageHoldingQueue specifically — the base class_entries_write policy's
-- canEnterScores/canScratch/canSkip/canEliminate OR-set is otherwise wide
-- enough that any judge or scribe could insert/delete holding rows. A
-- non-holding DELETE (the whole-roster wipe `setClassEntries` does, unreachable
-- from any UI but still a publicly callable Server Action) requires
-- canEditShow, matching legacy's grouping of `setEntries` with `panel`/
-- `setTest` under the same canEditShow gate (`[resource].js:1544`).
-- ---------------------------------------------------------------------------

create or replace function public.assert_class_entries_holding_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_class_id uuid := coalesce(new.class_id, old.class_id);
begin
  if (tg_op = 'INSERT' and new.holding = true)
     or (tg_op = 'DELETE' and old.holding = true) then
    if not public.has_show_permission(public.class_show_id(target_class_id), 'canManageHoldingQueue') then
      raise exception 'not authorized to manage the holding queue for this class';
    end if;
  end if;

  if tg_op = 'DELETE' and old.holding = false then
    if not public.has_show_permission(public.class_show_id(target_class_id), 'canEditShow') then
      raise exception 'not authorized to remove entries from this class';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists class_entries_holding_permission_check on public.class_entries;
create trigger class_entries_holding_permission_check
  before insert or delete on public.class_entries
  for each row execute function public.assert_class_entries_holding_permission();

-- ---------------------------------------------------------------------------
-- class_panel: judge/scribe seat assignment requires canEditShow in legacy
-- (api/shows/[id]/[resource].js:1544), not canManageStaff.
-- ---------------------------------------------------------------------------

drop policy if exists class_panel_write on public.class_panel;
create policy class_panel_write on public.class_panel
  for all using (public.has_show_permission(public.class_show_id(class_id), 'canEditShow'))
  with check (public.has_show_permission(public.class_show_id(class_id), 'canEditShow'));
