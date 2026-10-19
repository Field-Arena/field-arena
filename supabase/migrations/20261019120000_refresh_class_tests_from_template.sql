-- Test Builder: push an edited test out to the classes already using it.
--
-- assignTestTemplateToClass COPIES a test_templates row into class_tests, so
-- editing the test later never reached classes it was assigned to.
-- refresh_class_tests_from_template re-copies it into every class on one show
-- whose class_tests row still links that template, but only while the class
-- hasn't started scoring:
--
--   skipped 'published'        classes.results_published is true
--   skipped 'scoring_started'  any scores row exists for the class (by
--                              scores.class_id, or through one of its entries)
--
-- The classes are locked first (FOR UPDATE conflicts with the FOR KEY SHARE
-- lock a scores insert takes on its class through scores.class_id), then
-- checked with a fresh snapshot and updated in the same transaction. A mark
-- committed before the lock is seen and skips the class; one attempted after
-- it waits until this commits — no class that starts scoring mid-update is
-- re-copied. Same pattern as delete_show_classes_if_unentered.
--
-- SECURITY INVOKER: RLS on classes / class_tests still decides who may write
-- (class_tests_write requires canEditShow). The explicit canEditShow check up
-- front turns "RLS hid every row" into a clear error instead of a silent
-- "0 updated". Re-runnable.
--
-- Returns {"updated": [{classId, label}], "skipped": [{classId, label, reason}]}.

create or replace function public.refresh_class_tests_from_template(
  p_template_id uuid,
  p_show_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_template record;
  v_class record;
  v_updated jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_reason text;
begin
  if not public.has_show_permission(p_show_id, 'canEditShow') then
    raise exception 'You don''t have permission to change tests on this show.'
      using errcode = 'FA030';
  end if;

  select name, movements, collectives, sections, version_year
    into v_template
  from public.test_templates
  where id = p_template_id;
  if not found then
    raise exception 'That test no longer exists.' using errcode = 'FA031';
  end if;

  for v_class in
    select c.id, c.label, coalesce(c.results_published, false) as published
    from public.classes c
    where c.show_id = p_show_id
      and exists (
        select 1 from public.class_tests ct
        where ct.class_id = c.id and ct.test_template_id = p_template_id
      )
    order by c.id
    for update of c
  loop
    v_reason := null;

    if v_class.published then
      v_reason := 'published';
    elsif exists (select 1 from public.scores s where s.class_id = v_class.id)
       or exists (
         select 1
         from public.scores s
         join public.class_entries e on e.id = s.entry_id
         where e.class_id = v_class.id
       ) then
      v_reason := 'scoring_started';
    end if;

    if v_reason is not null then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object(
        'classId', v_class.id, 'label', v_class.label, 'reason', v_reason
      ));
      continue;
    end if;

    -- Same columns assignTestTemplateToClass copies. The test_template_id
    -- predicate drops a class that was reassigned to another test meanwhile.
    update public.class_tests
       set name = v_template.name,
           edition = v_template.version_year,
           movements = v_template.movements,
           collectives = v_template.collectives,
           sections = v_template.sections
     where class_id = v_class.id
       and test_template_id = p_template_id;

    if found then
      v_updated := v_updated || jsonb_build_array(jsonb_build_object(
        'classId', v_class.id, 'label', v_class.label
      ));
    end if;
  end loop;

  return jsonb_build_object('updated', v_updated, 'skipped', v_skipped);
end;
$$;

-- Supabase grants EXECUTE to anon/authenticated directly.
revoke execute on function public.refresh_class_tests_from_template(uuid, uuid) from public, anon;
grant execute on function public.refresh_class_tests_from_template(uuid, uuid)
  to authenticated, service_role;
