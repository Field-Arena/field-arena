-- Demo seed data.
--
-- Ported from the legacy seeders db/seed.js (six organizations, venues and a
-- baseline set of shows) and db/seed-demo-data.js (the rich Peachtree dataset —
-- renamed shows, divisions, a class pool, and ~40 riders per show).
--
-- Two things differ from the legacy seeders, both forced by the schema:
--
--  1. No riders or horses rows. public.riders is keyed to auth.users, so every
--     rider row needs a real auth account behind it. The legacy seeder created
--     200 bare rider rows with no credentials, which is no longer expressible —
--     and creating 200 auth accounts to hold demo data would pollute the auth
--     table for no benefit.
--
--     This is not a workaround: it is what the legacy schema already described
--     as correct. class_entries.rider and .horse are text and documented as
--     "the universal display source", with rider_id/horse_id "additive, only
--     populated when a real rider account actually created the entry". An
--     organizer-imported roster is exactly that case. Entries below therefore
--     carry rider/horse names and no FKs, which is how a roster-imported show
--     legitimately looks.
--
--     Real rider accounts, with horses, orders and waivers, are created by
--     scripts/seed-auth-users.mjs — a handful of them, enough to exercise auth
--     and RLS for real.
--
--  2. Fixed UUIDs and ON CONFLICT DO NOTHING throughout, so this file is
--     idempotent. The legacy seeders were explicitly not: re-running
--     seed-demo-data.js added a second batch of 200 riders every time.
--
-- Entry rows are generated with generate_series rather than written out as
-- 1,600 literal INSERTs. Names are picked by modulo over fixed arrays, so the
-- output is deterministic — the same seed produces the same roster every run,
-- which the legacy pseudo-random generator did not guarantee.

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
insert into public.organizations
  (id, name, city, region, country, currency, locale, timezone, avg_entry_value, is_demo)
values
  ('a0000000-0000-4000-8000-000000000001', 'Blue Ridge Eventing Association', 'Asheville',     'NC', 'US', 'USD', 'en-US', 'America/New_York',    68, true),
  ('a0000000-0000-4000-8000-000000000002', 'Cascade Dressage Society',        'Portland',      'OR', 'US', 'USD', 'en-US', 'America/Los_Angeles', 68, true),
  ('a0000000-0000-4000-8000-000000000003', 'Golden Gate Equestrian League',   'San Francisco', 'CA', 'US', 'USD', 'en-US', 'America/Los_Angeles', 68, true),
  ('a0000000-0000-4000-8000-000000000004', 'Peachtree Dressage Association',  'Atlanta',       'GA', 'US', 'USD', 'en-US', 'America/New_York',    68, true),
  ('a0000000-0000-4000-8000-000000000005', 'Prairie Winds Horse Shows',       'Kansas City',   'MO', 'US', 'USD', 'en-US', 'America/New_York',    68, true),
  ('a0000000-0000-4000-8000-000000000006', 'Tidewater Hunter/Jumper Club',    'Norfolk',       'VA', 'US', 'USD', 'en-US', 'America/New_York',    68, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Venues
-- ---------------------------------------------------------------------------
insert into public.venues (id, org_id, name, city, region, country)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Asheville Showgrounds',          'Asheville',     'NC', 'US'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Portland Showgrounds',           'Portland',      'OR', 'US'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'San Francisco Showgrounds',      'San Francisco', 'CA', 'US'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'Atlanta Showgrounds',            'Atlanta',       'GA', 'US'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 'Kansas City Showgrounds',        'Kansas City',   'MO', 'US'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', 'Norfolk Showgrounds',            'Norfolk',       'VA', 'US'),
  -- The four Peachtree venues the rich demo dataset references by name.
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004', 'Wills Park Equestrian',          'Alpharetta',    'GA', 'US'),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', 'Peachtree Equestrian Park',      'Atlanta',       'GA', 'US'),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'Chattahoochee Equestrian Center','Gainesville',   'GA', 'US'),
  ('b0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000004', 'Savannah Equestrian Center',     'Savannah',      'GA', 'US')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Shows
-- ---------------------------------------------------------------------------
-- The five Peachtree shows carry the document requirements the rider and
-- staff-side document flows read, plus merch config and the expense checklist
-- the billing tab seeds client-side in the legacy build.
insert into public.shows (
  id, org_id, venue_id, name, date_label, start_date, end_date, status,
  disciplines, governing_bodies, show_type, published, timezone,
  document_requirements, merchandise_enabled, merch_items, expenses
)
values
  -- Peachtree — the rich set the organizer dashboard renders.
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007',
   'Blue Ridge Dressage Weekend',     'Jul 10 – Jul 12, 2026', '2026-07-10', '2026-07-12', 'green',
   '["Dressage"]', '["USEF"]', 'rated', true, 'America/New_York',
   '[{"id":"dr-blue-ridge-coggins","label":"Coggins","requiresExpiration":true,"requiresApproval":true},
     {"id":"dr-blue-ridge-vet","label":"Vet Report","requiresExpiration":false,"requiresApproval":false}]',
   true,
   '[{"id":"m1","name":"T-Shirt","price":25},{"id":"m2","name":"Hat","price":15}]',
   '[{"id":"e1","label":"Judge fees","amount":2400},{"id":"e2","label":"Arena rental","amount":3200},
     {"id":"e3","label":"Ribbons and awards","amount":850},{"id":"e4","label":"Shavings","amount":1100}]'),

  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000008',
   'Peachtree Summer Classic',        'Jul 11 – Jul 12, 2026', '2026-07-11', '2026-07-12', 'green',
   '["Dressage"]', '["USEF"]', 'rated', true, 'America/New_York',
   '[{"id":"dr-summer-coggins","label":"Coggins","requiresExpiration":true,"requiresApproval":true}]',
   false, '[]', '[]'),

  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000009',
   'Winter Warm-Up Dressage',         'Jan 9 – Jan 10, 2027',  '2027-01-09', '2027-01-10', 'red',
   '["Dressage"]', '["USEF"]', 'schooling', false, 'America/New_York',
   '[]', false, '[]', '[]'),

  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000009',
   'Georgia Autumn Dressage Days',    'Aug 15 – Aug 16, 2026', '2026-08-15', '2026-08-16', 'yellow',
   '["Dressage"]', '["USEF"]', 'rated', true, 'America/New_York',
   '[{"id":"dr-autumn-coggins","label":"Coggins","requiresExpiration":true,"requiresApproval":true}]',
   false, '[]', '[]'),

  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-00000000000a',
   'Coastal Georgia Dressage Fest',   'Sep 5 – Sep 6, 2026',   '2026-09-05', '2026-09-06', 'yellow',
   '["Dressage"]', '["USEF"]', 'rated', true, 'America/New_York',
   '[]', false, '[]', '[]'),

  -- The other five organizations, one or two shows each.
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Smoky Mountain Horse Trials',     'May 2–3, 2026',   '2026-05-02', '2026-05-03', 'green',
   '["Eventing"]', '["USEF"]', 'rated', true, 'America/New_York', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Pisgah Fall Combined Test',       'Sep 19, 2026',    '2026-09-19', '2026-09-19', 'yellow',
   '["Eventing"]', '["USEF"]', 'schooling', true, 'America/New_York', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   'Rose City Spring Dressage',       'Apr 11–12, 2026', '2026-04-11', '2026-04-12', 'green',
   '["Dressage"]', '["USDF","USEF"]', 'rated', true, 'America/Los_Angeles', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   'Cascade Summer Classic',          'Jul 25, 2026',    '2026-07-25', '2026-07-25', 'yellow',
   '["Dressage"]', '["USDF"]', 'schooling', true, 'America/Los_Angeles', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003',
   'Bay Area Dressage Festival',      'Jun 6–7, 2026',   '2026-06-06', '2026-06-07', 'green',
   '["Dressage"]', '["USEF","FEI"]', 'rated', true, 'America/Los_Angeles', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000005',
   'Heartland Schooling Series #1',   'Mar 21, 2026',    '2026-03-21', '2026-03-21', 'green',
   '["Dressage"]', '["USEF"]', 'schooling', true, 'America/Chicago', '[]', false, '[]', '[]'),
  ('c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000006',
   'Coastal Classic Hunter/Jumper',   'May 30–31, 2026', '2026-05-30', '2026-05-31', 'yellow',
   '["Hunter/Jumper"]', '["USEF"]', 'rated', true, 'America/New_York', '[]', false, '[]', '[]')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Divisions — the three the demo dataset uses, on each Peachtree show
-- ---------------------------------------------------------------------------
insert into public.divisions (show_id, name, position)
select s.id, d.name, d.position
from public.shows s
cross join (values ('Junior Rider', 0), ('Adult Amateur', 1), ('Open', 2)) as d(name, position)
where s.org_id = 'a0000000-0000-4000-8000-000000000004'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Classes — the eight-test pool, on each Peachtree show
-- ---------------------------------------------------------------------------
insert into public.classes (show_id, event, label, division, fee, judges_count, governing_body, ribbon_places)
select s.id, s.name, c.label, c.division, c.fee, 1, 'USEF', 6
from public.shows s
cross join (values
  ('Introductory Test A',    55.00, 'Junior Rider'),
  ('Training Level Test 1',  65.00, 'Adult Amateur'),
  ('Training Level Test 3',  65.00, 'Adult Amateur'),
  ('First Level Test 1',     70.00, 'Open'),
  ('First Level Test 3',     70.00, 'Open'),
  ('Second Level Test 1',    75.00, 'Open'),
  ('Second Level Test 3',    75.00, 'Open'),
  ('Third Level Test 1',     80.00, 'Open')
) as c(label, fee, division)
where s.org_id = 'a0000000-0000-4000-8000-000000000004'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Rider-purchasable add-ons
-- ---------------------------------------------------------------------------
-- stalls/nights are set so the rider dashboard can derive real stabling counts
-- from paid orders instead of hardcoding zero.
insert into public.add_ons (show_id, name, price, enabled, stalls, nights, shavings, tack)
select s.id, a.name, a.price, true, a.stalls, a.nights, a.shavings, a.tack
from public.shows s
cross join (values
  ('Stabling — 1 night',   45.00, 1, 1, 0, 0),
  ('Stabling — 2 nights',  85.00, 1, 2, 0, 0),
  ('Stabling — daytime',   25.00, 1, 0, 0, 0),
  ('Shavings — per bag',   12.00, 0, 0, 1, 0),
  ('Tack stall',           60.00, 0, 0, 0, 1)
) as a(name, price, stalls, nights, shavings, tack)
where s.org_id = 'a0000000-0000-4000-8000-000000000004'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Qualifying class types and vendor booth catalog
-- ---------------------------------------------------------------------------
insert into public.qual_types (show_id, name, price, enabled)
select s.id, q.name, q.price, q.enabled
from public.shows s
cross join (values
  ('USDF Qualifying', 15.00, true),
  ('USEF Qualifying', 15.00, true),
  ('FEI Qualifying',  25.00, false)
) as q(name, price, enabled)
where s.org_id = 'a0000000-0000-4000-8000-000000000004'
on conflict do nothing;

insert into public.vendor_items (show_id, name, price, enabled, qty)
select s.id, v.name, v.price, true, v.qty
from public.shows s
cross join (values
  ('10x10 booth',           250.00, 12),
  ('10x20 booth',           425.00, 6),
  ('Electric hookup',        75.00, null::integer),
  ('Additional table',       25.00, null::integer)
) as v(name, price, qty)
where s.org_id = 'a0000000-0000-4000-8000-000000000004'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Staff assignments
-- ---------------------------------------------------------------------------
-- user_id stays null: these people are invited but have not accepted, which is
-- exactly what status = 'pending' means. The permission columns are left at
-- their defaults so the resolver in has_show_permission() is exercised against
-- real role defaults rather than pre-granted overrides.
insert into public.staff_assignments (show_id, name, first_name, last_name, role, email, status, is_steward)
select s.id, t.name, t.first_name, t.last_name, t.role, t.email, 'pending', t.is_steward
from public.shows s
cross join (values
  ('Elena Marsh',   'Elena',   'Marsh',    'Judge',      'elena.marsh@fieldarena-demo.test',   false),
  ('Tom Reyes',     'Tom',     'Reyes',    'Scribe',     'tom.reyes@fieldarena-demo.test',     false),
  ('Priya Nair',    'Priya',   'Nair',     'Judge',      'priya.nair@fieldarena-demo.test',    false),
  ('Sam Whitfield', 'Sam',     'Whitfield','ShowStaff',  'sam.whitfield@fieldarena-demo.test', false),
  ('Dana Boyd',     'Dana',    'Boyd',     'Announcer',  'dana.boyd@fieldarena-demo.test',     true),
  ('Marcus Hale',   'Marcus',  'Hale',     'Show Admin', 'marcus.hale@fieldarena-demo.test',   false)
) as t(name, first_name, last_name, role, email, is_steward)
where s.id in (
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000002'
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Member database (org-wide)
-- ---------------------------------------------------------------------------
insert into public.member_database
  (org_id, name, first_name, last_name, email, phone, role, membership_status, membership_expires)
values
  ('a0000000-0000-4000-8000-000000000004', 'Elena Marsh',   'Elena',  'Marsh',   'elena.marsh@fieldarena-demo.test',   '404-555-1001', 'Judge',           'active',   '2027-12-31'),
  ('a0000000-0000-4000-8000-000000000004', 'Tom Reyes',     'Tom',    'Reyes',   'tom.reyes@fieldarena-demo.test',     '404-555-1002', 'Scribe',          'active',   '2027-12-31'),
  ('a0000000-0000-4000-8000-000000000004', 'Priya Nair',    'Priya',  'Nair',    'priya.nair@fieldarena-demo.test',    '404-555-1003', 'Judge',           'active',   '2026-12-31'),
  ('a0000000-0000-4000-8000-000000000004', 'Sam Whitfield', 'Sam',    'Whitfield','sam.whitfield@fieldarena-demo.test','404-555-1004', 'Volunteer',       'inactive', '2025-12-31'),
  ('a0000000-0000-4000-8000-000000000004', 'Nina Cohen',    'Nina',   'Cohen',   'nina.cohen@fieldarena-demo.test',    '404-555-1005', 'Adult Amateur',   'active',   '2027-06-30'),
  ('a0000000-0000-4000-8000-000000000004', 'Chase Doyle',   'Chase',  'Doyle',   'chase.doyle@fieldarena-demo.test',   '404-555-1006', 'Junior Rider',    'active',   '2027-06-30')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Class entries — the roster
-- ---------------------------------------------------------------------------
-- Deterministic generation. Each Peachtree show gets 40 competitors; each
-- competitor is entered in two of that show's eight classes, picked by modulo so
-- the spread is even and repeatable. Bib numbers are assigned per show from the
-- show's starting_rider_number, zero-padded to four digits, matching the legacy
-- numbering format.
with names as (
  select
    array['Amanda','Ben','Carla','David','Emma','Frank','Grace','Henry','Isla','Jack',
          'Karen','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tara',
          'Uma','Victor','Wendy','Xavier','Yara','Zoe','Aaron','Bianca','Cole','Dana',
          'Eli','Faith','Gavin','Hazel','Ian','Julia','Kyle','Lena','Marcus','Nora'] as firsts,
    array['Clarke','Foster','Diaz','Ellis','Grant','Hill','Ito','Jones','King','Lee',
          'Moss','Nash','Owens','Park','Reed','Shaw','Turner','Vance','Ward','York',
          'Adams','Boyd','Cruz','Dean','Evans','Flynn','Gould','Hayes','Irwin','James',
          'Katz','Long','Meyer','Novak','Olsen','Pope','Quill','Ross','Stone','Tate'] as lasts,
    array['Beau','Cassidy','Duke','Willow','Finn','Ranger','Luna','Maverick','Pepper','Scout',
          'Biscuit','Comet','Dakota','Echo','Flame','Gunner','Harley','Indigo','Jasper','Koda',
          'Lyric','Magic','Nutmeg','Onyx','Phoenix','Quest','Rebel','Sunny','Tango','Valor',
          'Whiskey','Zephyr','Apollo','Bella','Cocoa','Diesel','Ember','Gizmo','Hunter','Ivy'] as horses,
    array['B','K','J','S','II'] as suffixes
),
show_classes as (
  select
    c.id as class_id,
    c.show_id,
    s.starting_rider_number,
    row_number() over (partition by c.show_id order by c.label) - 1 as class_index,
    count(*) over (partition by c.show_id) as class_count
  from public.classes c
  join public.shows s on s.id = c.show_id
  where s.org_id = 'a0000000-0000-4000-8000-000000000004'
),
-- A per-show offset is essential here. Deriving the name from the competitor
-- index alone gives every show an identical roster — the same forty people at
-- all five shows, which reads as obviously fake.
--
-- The offsets are not arbitrary. Both name arrays have length 40, so with a
-- first-name offset of 13s and a last-name offset of Ks, the pair relationship
-- reduces to last ≡ 7·first + (K − 91)s (mod 40). Any K where K ≡ 91 ≡ 11
-- (mod 40) makes that s-term vanish, and every show gets the identical set of
-- 40 full names in a different order — which is exactly what K = 11 did on the
-- first attempt here. K = 3 leaves a live 8s term, so the five shows draw
-- roughly 200 distinct competitors with a little natural overlap, which is what
-- a real regional series looks like.
show_list as (
  select show_id, (dense_rank() over (order by show_id) - 1)::int as show_index
  from (select distinct show_id from show_classes) d
),
competitors as (
  select
    sl.show_id,
    i as competitor_index,
    n.firsts[1 + ((i + sl.show_index * 13) % array_length(n.firsts, 1))] || ' ' ||
      n.lasts[1 + ((i * 7 + sl.show_index * 3) % array_length(n.lasts, 1))] as rider_name,
    n.horses[1 + ((i * 3 + sl.show_index * 17) % array_length(n.horses, 1))] || ' ' ||
      n.suffixes[1 + ((i + sl.show_index) % array_length(n.suffixes, 1))] as horse_name
  from show_list sl
  cross join names n
  cross join generate_series(0, 39) as i
),
-- Two classes per competitor, offset so entries spread across the pool.
pairs as (
  select
    comp.show_id,
    comp.competitor_index,
    comp.rider_name,
    comp.horse_name,
    sc.class_id,
    sc.starting_rider_number
  from competitors comp
  join show_classes sc
    on sc.show_id = comp.show_id
   and sc.class_index in (
     comp.competitor_index % sc.class_count,
     (comp.competitor_index + 3) % sc.class_count
   )
)
insert into public.class_entries (class_id, num, rider, horse, ride_order, draw, status)
select
  p.class_id,
  lpad((p.starting_rider_number + p.competitor_index)::text, 4, '0'),
  p.rider_name,
  p.horse_name,
  row_number() over (partition by p.class_id order by p.competitor_index),
  row_number() over (partition by p.class_id order by p.competitor_index),
  'scheduled'
from pairs p
on conflict (class_id, num) do nothing;

-- ---------------------------------------------------------------------------
-- Scoring catalog
-- ---------------------------------------------------------------------------
-- A representative slice of the platform test-sheet library. The legacy build
-- kept this as a hardcoded array in the SuperAdmin view with no backend at all,
-- so every edit through its catalog editor was lost on refresh.
insert into public.scoring_catalog (title, level, discipline, family, governing_body, def)
values
  ('Introductory Test A', 'Introductory', 'Dressage', 'movement', 'USEF',
   '{"arena":"20x40","rideTime":"4:30","maxPoints":170,
     "movements":[{"n":1,"text":"Enter working trot rising, track left","coef":1},
                  {"n":2,"text":"Circle left 20m working trot","coef":1},
                  {"n":3,"text":"Working walk between markers","coef":1},
                  {"n":4,"text":"Circle right 20m working trot","coef":1},
                  {"n":5,"text":"Down centre line, halt, salute","coef":1}],
     "collectives":[{"key":"gaits","label":"Gaits","coef":1},
                    {"key":"impulsion","label":"Impulsion","coef":1},
                    {"key":"submission","label":"Submission","coef":1},
                    {"key":"rider","label":"Rider position and seat","coef":1}]}'),
  ('Training Level Test 1', 'Training', 'Dressage', 'movement', 'USEF',
   '{"arena":"20x40","rideTime":"5:00","maxPoints":220,
     "movements":[{"n":1,"text":"Enter working trot, halt, salute","coef":1},
                  {"n":2,"text":"Circle left 20m","coef":1},
                  {"n":3,"text":"Working canter left lead","coef":1},
                  {"n":4,"text":"Circle right 20m","coef":1},
                  {"n":5,"text":"Free walk on a long rein","coef":2},
                  {"n":6,"text":"Down centre line, halt, salute","coef":1}],
     "collectives":[{"key":"gaits","label":"Gaits","coef":1},
                    {"key":"impulsion","label":"Impulsion","coef":1},
                    {"key":"submission","label":"Submission","coef":1},
                    {"key":"rider","label":"Rider position and seat","coef":1}]}'),
  ('First Level Test 1', 'First', 'Dressage', 'movement', 'USEF',
   '{"arena":"20x60","rideTime":"5:30","maxPoints":250,
     "movements":[{"n":1,"text":"Enter working trot, halt, salute","coef":1},
                  {"n":2,"text":"Leg yield left","coef":1},
                  {"n":3,"text":"Lengthen stride in trot","coef":2},
                  {"n":4,"text":"Working canter, 15m circle","coef":1},
                  {"n":5,"text":"Lengthen stride in canter","coef":2},
                  {"n":6,"text":"Down centre line, halt, salute","coef":1}],
     "collectives":[{"key":"gaits","label":"Gaits","coef":1},
                    {"key":"impulsion","label":"Impulsion","coef":1},
                    {"key":"submission","label":"Submission","coef":1},
                    {"key":"rider","label":"Rider position and seat","coef":1}]}'),
  ('Second Level Test 1', 'Second', 'Dressage', 'movement', 'USDF', '{}'),
  ('Third Level Test 1', 'Third', 'Dressage', 'movement', 'USDF', '{}'),
  ('Prix St. Georges', 'PSG', 'Dressage', 'movement', 'FEI', '{}'),
  ('Musical Freestyle — First Level', 'First', 'Dressage', 'freestyle', 'USDF',
   '{"technical":[],"artistic":[]}'),
  ('Hunter Under Saddle', 'Open', 'Hunter/Jumper', 'placing', 'USEF',
   '{"method":"placing","criteria":"Judged on movement, manners and way of going."}')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Sales CRM
-- ---------------------------------------------------------------------------
insert into public.leads (org_name, contact_name, email, shows_per_year, status, cost_per_event, avg_revenue_per_show)
values
  ('Sandhills Dressage Club',    'Marion Webb',  'marion@sandhills-demo.test',  4, 'demo_scheduled', 450.00,  9800.00),
  ('Lakeshore Equestrian',       'Dev Anand',    'dev@lakeshore-demo.test',     7, 'demo_completed', 620.00, 14200.00),
  ('High Desert Horse Shows',    'Rosa Iglesias','rosa@highdesert-demo.test',  12, 'onboarding',     780.00, 21500.00),
  ('Cornerstone Riding Academy', 'Ken Osei',     'ken@cornerstone-demo.test',   2, 'new',            310.00,  5400.00)
on conflict do nothing;
