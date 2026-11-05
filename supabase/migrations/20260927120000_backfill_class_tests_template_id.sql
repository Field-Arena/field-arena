-- 20260923120000_class_tests_template_link.sql added test_template_id but
-- never backfilled it, so every class_tests row assigned before that
-- migration kept test_template_id null forever (until someone happened to
-- re-assign that exact class). The app's UI fell back to matching those
-- rows by their frozen name snapshot against every CURRENT template
-- sharing that name -- confirmed live in dev: one org has 4 different
-- templates all named "Training Level Test 1", and the name-fallback
-- attached unrelated classes (an Intermediate I class, a Grand Prix class)
-- to all 4 of them simultaneously as "currently used by". That fallback is
-- being removed from the app entirely (unsafe by construction: a name
-- isn't unique). This backfills what can be resolved without guessing --
-- only when a legacy row's name matches exactly one template in its own
-- show's organization. Rows that match zero or multiple templates are
-- left null; they simply won't show under any template's "currently used
-- by" list anymore, rather than showing under the wrong one(s).
update public.class_tests ct
set test_template_id = matched.template_id
from (
  select ct2.class_id, (array_agg(tt.id))[1] as template_id
  from public.class_tests ct2
  join public.classes c on c.id = ct2.class_id
  join public.shows s on s.id = c.show_id
  join public.test_templates tt on tt.org_id = s.org_id and tt.name = ct2.name
  where ct2.test_template_id is null
  group by ct2.class_id
  having count(distinct tt.id) = 1
) matched
where ct.class_id = matched.class_id and ct.test_template_id is null;
