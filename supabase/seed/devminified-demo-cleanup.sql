-- Removes everything devminified-demo-seed.sql added, and nothing else.
-- Deleting the shows cascades their classes/entries/orders/waivers; deleting
-- the demo auth users cascades their riders and horses.
begin;
-- Entry deletes are guarded by a trigger that requires a signed-in organizer;
-- skip triggers for this transaction only (demo rows, removed by fixed id).
set local session_replication_role = replica;
delete from public.class_entries where id in (
  select e.id from public.class_entries e join public.classes c on c.id = e.class_id
  where c.show_id in (md5('devmin-demo:show:1')::uuid, md5('devmin-demo:show:2')::uuid, md5('devmin-demo:show:3')::uuid));
delete from public.waiver_signatures where show_id in (md5('devmin-demo:show:1')::uuid, md5('devmin-demo:show:2')::uuid, md5('devmin-demo:show:3')::uuid);
delete from public.orders where show_id in (md5('devmin-demo:show:1')::uuid, md5('devmin-demo:show:2')::uuid, md5('devmin-demo:show:3')::uuid);
delete from public.classes where show_id in (md5('devmin-demo:show:1')::uuid, md5('devmin-demo:show:2')::uuid, md5('devmin-demo:show:3')::uuid);
delete from public.shows where id in (md5('devmin-demo:show:1')::uuid, md5('devmin-demo:show:2')::uuid, md5('devmin-demo:show:3')::uuid);
-- With triggers off, FK cascades don't fire either, so delete children first.
delete from public.horses where rider_id in (select id from public.riders where email like 'devmin-demo-%@fieldarena-demo.test');
delete from public.riders where email like 'devmin-demo-%@fieldarena-demo.test';
delete from auth.users where email like 'devmin-demo-%@fieldarena-demo.test'
  and raw_user_meta_data->>'demo_seed' = 'devmin-demo-2026-10';
commit;
