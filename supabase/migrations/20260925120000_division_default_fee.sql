-- Class creation had one single global default fee (DEFAULT_CLASS_FEE, $65)
-- for every class regardless of division, and separately, four independent
-- class-creation flows each wrote their own disconnected text into
-- classes.division -- never the show's actual configured Divisions list.
-- Both are client-reported bugs ("divisions are not connected to it",
-- "Default prices are not connected also"). This column is the fix for the
-- second half: each division can carry its own default price, applied when
-- an organizer adds a class under it. Nullable -- a division with no
-- default set falls back to the existing global DEFAULT_CLASS_FEE in code.
alter table public.divisions add column default_fee numeric(10, 2);
