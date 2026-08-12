-- Real anchor for the live-scoring screen's "Ride Time" countdown — legacy's
-- own version (showrunner-scoring.html's rideStartedAt) had no real anchor
-- either, just a client-fabricated seed at page load, which is why this app
-- never carried the countdown card at all until now (see LiveClockStrip's
-- doc comment). Stamped once, server-side, the first time a class's current
-- entry is read after becoming current — same "write in a read" pattern
-- `getScoringState` already uses to seed `class_tests` from the catalog
-- fallback, not a new mechanism.
alter table public.class_entries add column ride_started_at timestamptz;
