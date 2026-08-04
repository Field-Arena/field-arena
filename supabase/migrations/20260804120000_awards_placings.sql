-- Awards: the two facts placings need that the schema never carried.
--
-- Ported alongside showstaff.html's unitPlacings/pctThenCtotDesc. Both of
-- these were per-entry values in the legacy build's in-memory model and had no
-- column here, so the Awards screen could rank by percentage alone and could
-- not split by rider division at all.

-- The rider's division for this ride: Junior, Young Rider, Adult Amateur, or
-- Open. It is per-ENTRY, not per-rider — the same person can ride one horse as
-- Open and another as Adult Amateur at the same show, which is exactly the
-- split the "By Division" awards mode exists to separate.
--
-- 'O' by default, matching divisionLabel()'s own fallback: anything not one of
-- the four known codes is treated as Open rather than as its own division.
alter table public.class_entries
  add column if not exists division text not null default 'O'
    check (division in ('J', 'Y', 'A', 'O'));

comment on column public.class_entries.division is
  'Rider division for this ride: J unior / Y oung rider / A dult amateur / O pen.';

-- The collective-marks total, used only to break a tie on percentage.
--
-- Nullable on purpose: an unscored ride has no collectives, and
-- pctThenCtotDesc treats a missing value as "cannot break this tie" rather
-- than as zero — scoring a null as 0 would hand the win to whichever tied
-- rider happened to be scored first.
alter table public.class_entries
  add column if not exists collective_total numeric(6, 3);

comment on column public.class_entries.collective_total is
  'Collective-marks total. Tie-break for equal final_pct; null means the tie stands.';

-- Per-class ribbon colour overrides, from the legacy `row.ribbonColors` that
-- ribbon(i, override) consults before falling back to the standard order.
-- A show awarding its own championship colours sets them here; null keeps the
-- traditional blue/red/yellow/white/pink/green order.
alter table public.classes
  add column if not exists ribbon_colors jsonb;

comment on column public.classes.ribbon_colors is
  'Optional [{name,bg,fg}] overriding the standard ribbon order for this class.';
