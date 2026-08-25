-- Three additive, backward-compatible additions:
--
-- 1) classes.run_order  — an explicit manual running order for classes. When the
--    show's schedule preference is set to "custom", classes are ordered by this
--    integer (ascending) instead of by level. Null keeps the existing level-based
--    ordering, so nothing changes for shows that don't opt in.
--
-- 2) classes.sponsor    — an optional sponsor / "presented by" name shown next to
--    the class label. Pure display; never affects scoring or scheduling.
--
-- 3) class_tests.sections — the structured score-sheet (Sections -> Items ->
--    Instructions) copied alongside the existing movements/collectives when a
--    test template is assigned to a class. The judge sheet reads it to show
--    section grouping and subtotals; the live scoring path still uses the flat
--    movements/collectives, so this is display structure only and safe.

alter table public.classes
  add column if not exists run_order integer,
  add column if not exists sponsor text;

alter table public.class_tests
  add column if not exists sections jsonb default '[]'::jsonb;
