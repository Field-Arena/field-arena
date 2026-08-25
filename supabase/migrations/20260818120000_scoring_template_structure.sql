-- Score-sheet engine, phase 1 (foundation): give a test template the richer,
-- discipline-neutral structure the client asked for, WITHOUT breaking anything.
--
-- Everything here is additive. The existing `movements` / `collectives` jsonb
-- columns stay exactly as they are — the current judge/scoring path (which reads
-- class_tests, populated by assignTestTemplateToClass) is untouched. The builder
-- keeps those two columns in sync from the new `sections` structure so a test
-- created in the new editor still scores in the current workspace.
--
-- Stored as jsonb rather than a full relational tree (sections/items/instructions
-- as their own tables) on purpose for this phase: it captures the exact shape the
-- client specified — Test → Sections → Scored items → Instructions — while
-- staying a single, safe, reversible column add on a live table. A relational
-- split can follow once the shape is confirmed in use.

alter table public.test_templates
  add column if not exists discipline text,
  add column if not exists sheet_type text,
  add column if not exists governing_body text,
  add column if not exists version_year text,
  add column if not exists arena_size text,
  add column if not exists ride_time text,
  add column if not exists scoring_method text,
  add column if not exists max_points numeric,

  -- The new nested structure. Shape:
  -- [ { id, name, type, subtotal,
  --     items: [ { id, label, directive, maxScore, coef, required,
  --                instructions: [ { id, marker, instruction, gait, direction } ] } ] } ]
  add column if not exists sections jsonb default '[]'::jsonb,

  -- Configurable penalty/deduction rules, not free text.
  -- [ { id, name, type, value, repeat, elimination } ]
  add column if not exists penalties jsonb default '[]'::jsonb,

  -- How the final result is produced — a small config the one engine reads.
  -- { scoreType, applyCoefficients, finalDisplay, formula }
  add column if not exists scoring_config jsonb;
