-- Supabase Storage buckets and object policies.
--
-- Replaces the legacy Vercel Blob stores, and also replaces the two base64
-- data-URL text columns the legacy schema used for show logos and show images
-- before blob storage existed.
--
-- The earlier uncommitted version of this migration granted every authenticated
-- user read and write on every bucket, describing itself as "coarse for now".
-- That is not viable: horse-documents holds veterinary paperwork (Coggins tests,
-- vaccination records) belonging to individual riders, so blanket authenticated
-- read means any rider with an account can fetch any other rider's documents.
-- architecture.md states RLS is the security boundary, so the policies below are
-- scoped properly.
--
-- Scoping requires a path convention, because storage policies can only reason
-- about the object's key. This is that convention, and application upload code
-- must follow it:
--
--   logos/{show_id}/{filename}
--   show-images/{show_id}/{filename}
--   documents/{show_id}/{filename}
--   vendor-maps/{show_id}/{filename}
--   horse-documents/{rider_id}/{horse_id}/{filename}
--   catalog-docs/{folder}/{filename}
--
-- The first path segment is the authorization key in every case.

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('show-images', 'show-images', true),
  ('documents', 'documents', false),
  ('horse-documents', 'horse-documents', false),
  ('vendor-maps', 'vendor-maps', false),
  ('catalog-docs', 'catalog-docs', false)
on conflict (id) do nothing;

-- A path segment that should be a uuid may not be one, if an upload ignored the
-- convention above. Casting directly would raise inside a policy, which fails
-- the whole query rather than simply denying access; this returns null instead.
create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
returns null on null input
as $$
begin
  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

comment on function public.safe_uuid(text) is
  'Casts text to uuid, returning null instead of raising when the text is not a uuid. For use in storage policies.';

-- Convenience: the show id encoded in the first path segment, or null.
create or replace function public.storage_show_id(object_name text)
returns uuid
language sql
immutable
as $$
  select public.safe_uuid((storage.foldername(object_name))[1]);
$$;

-- Remove the blanket-access policies from the earlier uncommitted version of
-- this migration. These live on storage.objects, which is in the `storage`
-- schema, so they are NOT removed when the public schema is dropped and
-- rebuilt. Postgres combines permissive policies with OR, so leaving any one of
-- them in place would grant every authenticated user read and write on every
-- bucket regardless of the scoped policies added below — silently undoing the
-- entire point of this file.
drop policy if exists "fa_authenticated_read" on storage.objects;
drop policy if exists "fa_authenticated_insert" on storage.objects;
drop policy if exists "fa_authenticated_update" on storage.objects;
drop policy if exists "fa_authenticated_delete" on storage.objects;

-- ---------------------------------------------------------------------------
-- Public buckets: logos and show images
-- ---------------------------------------------------------------------------
-- Genuinely public — these appear on the marketing site and on rider-facing
-- show listings, both of which serve unauthenticated visitors.
drop policy if exists "fa_public_read" on storage.objects;
create policy "fa_public_read" on storage.objects
  for select
  using (bucket_id in ('logos', 'show-images'));

drop policy if exists "fa_show_branding_write" on storage.objects;
create policy "fa_show_branding_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('logos', 'show-images')
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  );

drop policy if exists "fa_show_branding_modify" on storage.objects;
create policy "fa_show_branding_modify" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('logos', 'show-images')
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  )
  with check (
    bucket_id in ('logos', 'show-images')
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  );

drop policy if exists "fa_show_branding_delete" on storage.objects;
create policy "fa_show_branding_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('logos', 'show-images')
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  );

-- ---------------------------------------------------------------------------
-- Per-show private buckets: documents and vendor maps
-- ---------------------------------------------------------------------------
drop policy if exists "fa_show_files_read" on storage.objects;
create policy "fa_show_files_read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('documents', 'vendor-maps')
    and public.can_view_show(public.storage_show_id(name))
  );

drop policy if exists "fa_documents_write" on storage.objects;
create policy "fa_documents_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  )
  with check (
    bucket_id = 'documents'
    and public.has_show_permission(public.storage_show_id(name), 'canEditShow')
  );

drop policy if exists "fa_vendor_maps_write" on storage.objects;
create policy "fa_vendor_maps_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'vendor-maps'
    and public.has_show_permission(public.storage_show_id(name), 'canManageVendors')
  )
  with check (
    bucket_id = 'vendor-maps'
    and public.has_show_permission(public.storage_show_id(name), 'canManageVendors')
  );

-- ---------------------------------------------------------------------------
-- Horse documents — the sensitive bucket
-- ---------------------------------------------------------------------------
-- Readable by the owning rider, and by staff on a show that horse is actually
-- entered in. Nobody else, including other riders.
drop policy if exists "fa_horse_docs_owner" on storage.objects;
create policy "fa_horse_docs_owner" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'horse-documents'
    and public.safe_uuid((storage.foldername(name))[1]) = auth.uid()
  )
  with check (
    bucket_id = 'horse-documents'
    and public.safe_uuid((storage.foldername(name))[1]) = auth.uid()
  );

drop policy if exists "fa_horse_docs_staff_read" on storage.objects;
create policy "fa_horse_docs_staff_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'horse-documents'
    and exists (
      select 1
      from public.class_entries ce
      join public.classes c on c.id = ce.class_id
      where ce.horse_id = public.safe_uuid((storage.foldername(name))[2])
        and public.can_view_show(c.show_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Platform catalog documents
-- ---------------------------------------------------------------------------
-- Reference test sheets. Every organizer needs to read them; only SuperAdmin
-- curates them.
drop policy if exists "fa_catalog_docs_read" on storage.objects;
create policy "fa_catalog_docs_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog-docs');

drop policy if exists "fa_catalog_docs_write" on storage.objects;
create policy "fa_catalog_docs_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'catalog-docs' and public.is_super_admin())
  with check (bucket_id = 'catalog-docs' and public.is_super_admin());
