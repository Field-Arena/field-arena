-- Renumber running orders that start at 0. Re-runnable.
--
-- Checkout (src/modules/riders/data/checkout.ts) gave the first entry in an
-- empty class ride_order 0, while the draw, reorderRide and the holding
-- queue number rides from 1. The app now numbers checkout entries from 1;
-- this shifts every class whose running order starts at 0 up by one so
-- existing data matches. Relative order is unchanged, and scoring derives
-- the ride in the ring from that order (classes.scoring_pos is an index,
-- not a ride_order), so no pointer needs fixing.
--
-- assert_ride_action_permission gates ride_order changes on the caller's
-- show permission, which a migration (no signed-in user) never has, so that
-- one trigger is switched off for this statement inside the migration's
-- transaction.

alter table public.class_entries disable trigger class_entries_action_permission_check;

update public.class_entries ce
set ride_order = ce.ride_order + 1
where ce.class_id in (
  select class_id
  from public.class_entries
  group by class_id
  having min(ride_order) = 0
);

alter table public.class_entries enable trigger class_entries_action_permission_check;
