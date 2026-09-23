-- class_tests.name was the only link back to the test_templates row it was
-- assigned from, used purely to render "Currently used by" on the Test
-- Builder screen. That breaks whenever two templates share a name (e.g.
-- Duplicate produces several "X (copy)" rows) or a template gets renamed
-- after assignment — the hint then attaches to the wrong template, or to
-- none, making an already-assigned class look unassigned. A real FK fixes
-- this: it's stable across renames and unambiguous across duplicates.
alter table public.class_tests
  add column test_template_id uuid references public.test_templates (id) on delete set null;

create index class_tests_test_template_id_idx on public.class_tests (test_template_id);
