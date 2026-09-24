-- Venues were private to one organization (venues_select gated on
-- can_access_org(org_id), same as venues_write). A physical venue isn't
-- exclusive to whichever org happened to create the record first -- the same
-- showgrounds routinely hosts shows run by different organizations. Under
-- the old policy, every org had to recreate the same real-world venue from
-- scratch, with no link between the duplicates: inconsistent ring counts,
-- addresses, stall layouts, and no way to tell they're the same place.
--
-- Venues become a shared, browsable directory: any staff-side account can
-- read any venue (there's nothing sensitive here that isn't already shown
-- on public show pages -- name, city, address, ring/stall layout). Writes
-- stay owner-only: venues_write is untouched, and createVenue/updateVenue/
-- deleteVenue already double-check org_id app-side independent of RLS, so
-- only the org that created a venue can edit or delete it.
drop policy venues_select on public.venues;

create policy venues_select on public.venues
  for select using (exists (select 1 from public.users u where u.id = auth.uid()));
