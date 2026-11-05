-- Read-only check of the Peachtree Dressage Association demo dataset
-- (supabase/seed/demo-business-seed.sql, tag demo-seed-2026-10).
-- Returns one row of metric / value pairs. Safe to run any time.
--
--   scripts/apply-demo-seed.sh --verify
with org as (
  select 'a0000000-0000-4000-8000-000000000004'::uuid as id
),
demo_riders as (
  select r.id
  from public.riders r
  join auth.users u on u.id = r.id
  where u.raw_user_meta_data ->> 'demo_seed' = 'demo-seed-2026-10'
),
org_shows as (
  select s.* from public.shows s where s.org_id = (select id from org)
),
paid_orders as (
  select o.* from public.orders o
  where o.show_id in (select id from org_shows) and o.status = 'paid'
),
paid_vendor as (
  select b.* from public.vendor_bookings b
  where b.show_id in (select id from org_shows) and b.status = 'paid'
),
vendor_lines as (
  select b.id as booking_id, vi.name, i.qty
  from paid_vendor b
  join public.vendor_booking_items i on i.booking_id = b.id
  join public.vendor_items vi on vi.id = i.vendor_item_id
)
select metric, value from (values
  (1,  'riders (demo seed)',                     (select count(*) from demo_riders)::text),
  (2,  'riders with a paid order in the org',    (select count(distinct rider_id) from paid_orders)::text),
  (3,  'horses (demo seed riders)',              (select count(*) from public.horses where rider_id in (select id from demo_riders))::text),
  (4,  'riders owning 2+ horses',                (select count(*) from (select rider_id from public.horses where rider_id in (select id from demo_riders) group by rider_id having count(*) > 1) x)::text),
  (5,  'org venues (total)',                     (select count(*) from public.venues where org_id = (select id from org))::text),
  (6,  'venues hosting shows with paid orders',  (select count(distinct s.venue_id) from org_shows s where s.id in (select show_id from paid_orders))::text),
  (7,  'paid orders / tickets',                  (select count(*) from paid_orders)::text),
  (8,  'paid orders by show',                    coalesce((select string_agg(s.name || ': ' || n, '; ' order by n desc) from (select show_id, count(*) n from paid_orders group by show_id) x join org_shows s on s.id = x.show_id), '—')),
  (9,  'gross ticket revenue (amount_total)',    (select coalesce(sum(amount_total), 0) from paid_orders)::text),
  (10, 'platform fees (fee_total)',              (select coalesce(sum(fee_total), 0) from paid_orders)::text),
  (11, 'class entries on paid orders',           (select count(*) from public.class_entries where order_id in (select id from paid_orders))::text),
  (12, 'orders with stall bookings',             (select count(*) from public.stabling_requests where order_id in (select id from paid_orders))::text),
  (13, 'horse stalls / tack stalls booked',      (select coalesce(sum(horse_stalls), 0) || ' / ' || coalesce(sum(tack_stalls), 0) from public.stabling_requests where order_id in (select id from paid_orders))),
  (14, 'shavings bags sold',                     (select coalesce(sum((e ->> 'qty')::int), 0) from paid_orders o, jsonb_array_elements(o.items) e where e ->> 'kind' = 'addon' and e ->> 'label' ilike 'shavings%')::text),
  (15, 'vendors with paid bookings',             (select count(distinct name) from paid_vendor)::text),
  (16, 'vendor booths sold',                     (select coalesce(sum(qty), 0) from vendor_lines where name ilike '%booth%' or name ilike 'food truck%')::text),
  (17, 'electric hookups sold',                  (select coalesce(sum(qty), 0) from vendor_lines where name ilike 'electric%')::text),
  (18, 'water hookups sold',                     (select coalesce(sum(qty), 0) from vendor_lines where name ilike 'water%')::text),
  (19, 'vendor revenue (amount_total)',          (select coalesce(sum(amount_total), 0) from paid_vendor)::text),
  (20, 'members (org member_database)',          (select count(*) from public.member_database where org_id = (select id from org))::text),
  -- Integrity: all three should be 0.
  (21, 'CHECK orders total <> sum(items)',       (select count(*) from paid_orders o where o.amount_total <> (select coalesce(sum((e ->> 'amount')::numeric), 0) from jsonb_array_elements(o.items) e))::text),
  (22, 'CHECK orders items <> class entries',    (select count(*) from paid_orders o where (select count(*) from jsonb_array_elements(o.items) e where e ->> 'kind' = 'class_entry') <> (select count(*) from public.class_entries ce where ce.order_id = o.id))::text),
  (23, 'CHECK vendor total <> sum(lines)',       (select count(*) from paid_vendor b where b.amount_total <> (select coalesce(sum(round(round(vi.price * 1.08, 2) * i.qty, 2)), 0) from public.vendor_booking_items i join public.vendor_items vi on vi.id = i.vendor_item_id where i.booking_id = b.id))::text)
) as m(ord, metric, value)
order by ord;
