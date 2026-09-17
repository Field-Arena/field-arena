-- Numbering configuration for the filing cabinet: entry/bridle numbers are
-- always on (mirrors starting_rider_number); back numbers are opt-in per
-- show since the client hasn't confirmed the exact range/settings yet.
alter table public.shows
  add column starting_entry_number integer not null default 1,
  add column starting_bridle_number integer not null default 1,
  add column back_number_enabled boolean not null default false,
  add column starting_back_number integer;

alter table public.classes
  add column requires_back_number boolean not null default false;
