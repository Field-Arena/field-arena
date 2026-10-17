-- Devminified demo data: three "Demo ·" shows for the organizer dashboard.
-- Owner-requested 2026-10-17. Re-runnable (ON CONFLICT DO NOTHING on fixed ids).
-- Remove with supabase/seed/devminified-demo-cleanup.sql.
--
--   Demo · Autumn Classic            Oct 24–25  tickets CLOSED (closed Oct 15)
--   Demo · Harvest Dressage Festival Nov 7–8    tickets OPEN, close Oct 31 noon
--   Demo · Winter Schooling Show     Dec 5      tickets not on sale yet (open Oct 28)
--
-- 90 demo riders (auth users with NO password + @fieldarena-demo.test emails,
-- so they can never sign in), one horse each, 80–85 riders entered in each
-- show that's on sale (the not-yet-on-sale show has none),
-- a paid order per rider per show, waivers and Coggins in a mix of states.

begin;

create temp table _dm_show (k int primary key, id uuid, slug text, name text, date_label text,
  start_date text, end_date text, ticket_open text, ticket_close text, req uuid, lo int, hi int)
  on commit drop;
insert into _dm_show values
 (1, md5('devmin-demo:show:1')::uuid, 'demo-autumn-classic', 'Demo · Autumn Classic', 'Oct 24–25, 2026',
     '2026-10-24', '2026-10-25', '2026-09-20', '2026-10-15 18:00', md5('devmin-demo:req:1')::uuid, 1, 85),
 (2, md5('devmin-demo:show:2')::uuid, 'demo-harvest-dressage-festival', 'Demo · Harvest Dressage Festival', 'Nov 7–8, 2026',
     '2026-11-07', '2026-11-08', '2026-10-01', '2026-10-31 12:00', md5('devmin-demo:req:2')::uuid, 1, 80),
 (3, md5('devmin-demo:show:3')::uuid, 'demo-winter-schooling-show', 'Demo · Winter Schooling Show', 'Dec 5, 2026',
     '2026-12-05', '2026-12-05', '2026-10-28', '2026-11-28 18:00', md5('devmin-demo:req:3')::uuid, 6, 81);

insert into public.shows (id, org_id, name, slug, date_label, start_date, end_date, status, venue_name,
  ticket_open, ticket_close, published, published_at, timezone, runner_state, document_requirements,
  waiver_text, waiver_approved_text, waiver_approved_at, disciplines, locations)
select s.id, '85c17105-3291-4682-bcd9-ac9563ce8c9a', s.name, s.slug, s.date_label, s.start_date, s.end_date,
  'green', 'Devminified Equestrian Center', s.ticket_open, s.ticket_close, true, now(), 'America/New_York',
  '{}'::jsonb,
  jsonb_build_array(jsonb_build_object('id', s.req, 'label', 'Coggins', 'requiresApproval', true, 'requiresExpiration', true)),
  'I release the show organizer from liability for injury to myself or my horse. (Demo waiver.)',
  'I release the show organizer from liability for injury to myself or my horse. (Demo waiver.)',
  now(), '["Dressage"]'::jsonb,
  '[{"num":1,"name":"Ring 1"},{"num":2,"name":"Ring 2"}]'::jsonb
from _dm_show s
on conflict (id) do nothing;

-- Six classes per show.
create temp table _dm_class on commit drop as
select md5('devmin-demo:class:' || s.k || ':' || c.n)::uuid as id, s.k, s.id as show_id, c.n, c.label, c.fee, s.start_date
from _dm_show s
cross join (values (1,'Intro Level Test B',45),(2,'Training Level Test 1',55),(3,'Training Level Test 3',55),
                   (4,'First Level Test 1',65),(5,'First Level Test 3',65),(6,'Second Level Test 2',75)) c(n,label,fee);
insert into public.classes (id, show_id, label, display_name, division, arena, fee, date, run_order, governing_body)
select id, show_id, label, label, 'Open', case when n <= 3 then 'Ring 1' else 'Ring 2' end, fee, start_date, n, 'USDF'
from _dm_class on conflict (id) do nothing;

-- 90 riders, one horse each.
create temp table _dm_rider on commit drop as
select n,
  md5('devmin-demo:rider:' || n)::uuid as id,
  md5('devmin-demo:horse:' || n)::uuid as horse_id,
  'devmin-demo-' || n || '@fieldarena-demo.test' as email,
  (array['Ava','Mia','Ella','Grace','Lily','Chloe','Nora','Ruby','Hazel','Ivy','Sadie','Emma','Clara','Maya','Olivia'])[1 + (n % 15)] as first_name,
  (array['Walker','Hayes','Brooks','Carter','Reed','Bennett','Foster','Hughes','Price','Sullivan','Morgan','Ellis','Grant','Porter','Lane','Wells','Ford','Shaw'])[1 + ((n * 7) % 18)] as last_name,
  (array['Kismet','Sable','Marble','Juniper','Atlas','Bramble','Cinder','Dakota','Echo','Fable','Gatsby','Harbor','Indigo','Jasper','Legend','Maverick','Nimbus','Opal','Piper','Quill','Rocket','Sterling','Tango','Willow'])[1 + (n % 24)]
    || ' ' || (array['B','K','J','M','R','T','S','W'])[1 + (n % 8)] as horse_name
from generate_series(1, 90) n;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token,
  reauthentication_token, is_sso_user, is_anonymous)
select '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', r.email, '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', r.first_name || ' ' || r.last_name, 'demo_seed', 'devmin-demo-2026-10'),
  now(), now(), '', '', '', '', '', '', '', '', false, false
from _dm_rider r on conflict (id) do nothing;

insert into public.riders (id, email, first_name, last_name, city, state, category)
select id, email, first_name, last_name, 'Aiken', 'SC', 'Adult Amateur' from _dm_rider
on conflict (id) do nothing;

-- Coggins per show requirement, in a deliberate mix of states:
--   show 1: mostly approved, every 9th pending review, every 17th expired
--   show 2: approved except every 20th pending
--   show 3: two thirds approved, the rest not uploaded yet
insert into public.horses (id, rider_id, name, stable, trainer, document_uploads)
select r.horse_id, r.id, r.horse_name, 'Devminified Farm', 'Pat Reed',
  (select coalesce(jsonb_agg(u), '[]'::jsonb) from (
     select jsonb_build_object('requirementId', s.req, 'path', 'demo/coggins-' || r.n || '.pdf',
       'expirationDate', case when s.k = 1 and r.n % 17 = 0 then '2026-09-01' else '2027-06-30' end,
       'status', case when (s.k = 1 and r.n % 9 = 0) or (s.k = 2 and r.n % 20 = 0) then 'pending' else 'approved' end,
       'verified', not ((s.k = 1 and r.n % 9 = 0) or (s.k = 2 and r.n % 20 = 0))) as u
     from _dm_show s
     where r.n between s.lo and s.hi and not (s.k = 3 and r.n % 3 = 0)) x)
from _dm_rider r on conflict (id) do nothing;

-- One paid order per entered rider per show: one class, a second for every 3rd rider, plus the $7.99 fee.
create temp table _dm_entry on commit drop as
select s.k, s.id as show_id, r.n, r.id as rider_id, r.horse_id, r.first_name || ' ' || r.last_name as rider, r.horse_name,
  md5('devmin-demo:order:' || s.k || ':' || r.n)::uuid as order_id, c.id as class_id, c.fee,
  row_number() over (partition by c.id order by r.n) as ride_order
from _dm_show s
join _dm_rider r on r.n between s.lo and s.hi and s.k <> 3  -- show 3 isn't on sale yet: no entries
join _dm_class c on c.k = s.k and (c.n = 1 + (r.n % 6) or (r.n % 3 = 0 and c.n = 1 + ((r.n * 5 + 2) % 6) and 1 + ((r.n * 5 + 2) % 6) <> 1 + (r.n % 6)));

insert into public.orders (id, rider_id, show_id, amount_total, fee_total, status, items, created_at, paid_at)
select order_id, rider_id, show_id, sum(fee) + 7.99, 7.99, 'paid', '[]'::jsonb,
  now() - ((n % 20) || ' days')::interval, now() - ((n % 20) || ' days')::interval
from _dm_entry group by order_id, rider_id, show_id, n
on conflict (id) do nothing;

insert into public.class_entries (id, class_id, num, rider, horse, rider_id, horse_id, order_id, ride_order, division, status)
select md5('devmin-demo:entry:' || e.k || ':' || e.n || ':' || e.class_id)::uuid, e.class_id, (100 + e.n)::text,
  e.rider, e.horse_name, e.rider_id, e.horse_id, e.order_id, e.ride_order, 'O', 'scheduled'
from _dm_entry e on conflict (id) do nothing;

-- Waivers: show 1 every 11th unsigned, show 2 every 13th, show 3 every other rider.
insert into public.waiver_signatures (id, rider_id, show_id, full_name, signature_date)
select md5('devmin-demo:waiver:' || s.k || ':' || r.n)::uuid, r.id, s.id, r.first_name || ' ' || r.last_name, '2026-10-10'
from _dm_show s join _dm_rider r on r.n between s.lo and s.hi and s.k <> 3
where not ((s.k = 1 and r.n % 11 = 0) or (s.k = 2 and r.n % 13 = 0) or (s.k = 3 and r.n % 2 = 1))
on conflict (id) do nothing;

commit;
