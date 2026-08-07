-- Closes a real gap found while matching the Vendor port against legacy:
-- legacy's entry.html offered "I'm a Rider" / "I'm a Vendor" as parallel,
-- no-prior-account entry points (vendor-apply.html took a public POST with
-- no login at all). This port's Rider side already has the equivalent —
-- riders_insert_self below, backing riders/data/mutations.ts's
-- ensureRiderProfile/signUpRider ("buy first, account second") — but nothing
-- ever gave Vendor the same path: public.users had no self-insert policy of
-- any kind, so a brand-new visitor could never end up with
-- platform_role = 'Vendor' through the app, only through direct DB access.
--
-- Scoped tightly to platform_role = 'Vendor' and org_id is null (Vendor is
-- platform-wide, never org-scoped — see 20260727120200_identity.sql's own
-- comment on org_id) so this cannot be used to self-grant any staff role
-- (Organizer, ShowAdmin, SuperAdmin, etc.) — those stay invite-only, exactly
-- as documented in auth/data/mutations.ts's provisionedDestination.
create policy users_insert_self_vendor on public.users
  for insert
  with check (
    id = auth.uid()
    and platform_role = 'Vendor'
    and org_id is null
  );
