-- Who last set each USEF detail on a horse.
--
-- Riders and organizers can both edit a horse's USEF details (organizers only
-- for horses entered in their show; the existing horses_update_document_approval
-- policy already scopes that). A horse and its details carry from show to show,
-- so every value needs to say where it came from:
--
--   { "usef_number": { "source": "rider", "by": "Pat Moore", "byId": "<uuid>",
--                      "at": "2026-11-13T15:02:00.000Z" }, ... }
--
-- source is 'rider' | 'organizer' | 'usef'. Keys are the horses column names.
-- Only a value with source 'usef' may be refreshed silently by the planned USEF
-- integration; anything a person typed is flagged for them to confirm instead.
--
-- Additive: one new column with a default, so no existing row or behavior changes.

alter table public.horses
  add column if not exists usef_field_meta jsonb not null default '{}'::jsonb;

comment on column public.horses.usef_field_meta is
  'Per-field provenance for the USEF detail columns: { column: { source: rider|organizer|usef, by, byId, at } }.';
