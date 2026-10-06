-- A judge's licence / rating (e.g. USEF "S", USDF "L"), shown under the
-- judge's name in the Judge workspace and on Panel & Contacts, as in the
-- redesign. Per staff assignment, like every other per-show staff detail —
-- the organizer who staffs the show sets it, under the existing
-- staff_assignments write policies. Nullable: most roles never have one.
alter table public.staff_assignments
  add column license text
  constraint staff_assignments_license_length check (char_length(license) <= 40);
