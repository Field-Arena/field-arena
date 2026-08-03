'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
import {
  completeOrgProfileSchema,
  addOrgMemberSchema,
  createVenueSchema,
  updateVenueSchema,
  deleteVenueSchema,
} from '../schemas';

/**
 * Resolves the org a venue write should apply to: the caller's own org, or —
 * for a SuperAdmin previewing an organizer's workspace via "Enter as
 * organizer" — the org they're impersonating. `getOrganizerContext` (which
 * renders the Venues list a SuperAdmin sees while impersonating) already
 * resolves org id this same way; the venue mutations below previously only
 * checked `profile.org_id`, which is null for a SuperAdmin regardless of
 * impersonation, so saving/editing/deleting a venue while impersonating
 * failed with "Your account is not the owner of an organization" even though
 * the list of venues on screen was that org's own.
 */
async function requireOrgId(): Promise<string> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const impersonatedOrgId = await getImpersonatedOrgId();
  const orgId = impersonatedOrgId ?? profile.org_id;
  if (!orgId) throw new Error('Your account is not the owner of an organization.');
  return orgId;
}

/**
 * Writes an organizer's own organization profile, from the onboarding screen.
 *
 * The organization is taken from the caller's profile rather than the request
 * body — see the schema for why. A ShowAdmin has org_id null by design and is
 * refused here: their access comes from a staff_assignments row for one show,
 * which is not authority over the organization's identity.
 */
export async function completeOrganizationProfile(input: unknown): Promise<void> {
  const parsed = completeOrgProfileSchema.parse(input);

  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');
  if (!profile.org_id) {
    throw new Error('Your account is not the owner of an organization.');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      name: parsed.name,
      email: parsed.email,
      website: parsed.website ?? null,
      phone: parsed.phone ?? null,
      city: parsed.city ?? null,
      region: parsed.region ?? null,
      country: parsed.country ?? null,
    })
    .eq('id', profile.org_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
}

/**
 * Adds a person to the org's member database — a standing roster independent
 * of any one show, matching legacy's `maybeAddToMemberDatabase`. Deduped by
 * email within the org (legacy: `members.some(m => m.email === email)`) — a
 * person already on the roster is left alone rather than duplicated.
 *
 * Called from the staff module's `addStaffUser`, best-effort (see that
 * call site): the staff assignment or rider/vendor row it comes with is the
 * grant that actually matters, so a failure here must never roll that back.
 */
export async function addOrgMember(input: unknown): Promise<{ added: boolean }> {
  const parsed = addOrgMemberSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();

  const supabase = await createServerClient();

  const { data: existing, error: existingError } = await supabase
    .from('member_database')
    .select('id')
    .eq('org_id', parsed.orgId)
    .ilike('email', email)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return { added: false };

  const { error } = await supabase.from('member_database').insert({
    org_id: parsed.orgId,
    name: `${parsed.firstName} ${parsed.lastName}`.trim(),
    first_name: parsed.firstName,
    last_name: parsed.lastName,
    email,
    phone: parsed.phone ?? null,
    role: parsed.role ?? null,
    membership_status: parsed.membershipStatus,
    membership_expires: parsed.membershipExpires ?? null,
  });
  if (error) throw new Error(error.message);

  return { added: true };
}

/**
 * Adds a venue to the org's reusable library — showstaff.html's
 * saveLocationAction, POST branch. The org is resolved server-side via
 * requireOrgId (caller's own profile, or the impersonated org for a
 * SuperAdmin previewing an organizer's workspace) rather than accepted in the
 * request body: a signed-in organizer posting an org id would let them write
 * into someone else's organization (RLS's `venues_write` policy would very
 * likely stop the write, but the field has no reason to exist).
 */
export async function createVenue(input: unknown): Promise<{ id: string }> {
  const parsed = createVenueSchema.parse(input);
  const orgId = await requireOrgId();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('venues')
    .insert({
      org_id: orgId,
      name: parsed.name,
      address: parsed.address ?? null,
      website: parsed.website ?? null,
      phone: parsed.phone ?? null,
      contact: parsed.contact ?? null,
      rings: parsed.rings,
      stables: parsed.stables,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/venues');
  return { id: data.id };
}

/**
 * Edits a venue — showstaff.html's saveLocationAction, PATCH branch. Scoped
 * to the caller's own org (not just the row id) for the same reason as
 * createVenue: defense in depth alongside `venues_write`'s RLS check, not a
 * substitute for it.
 */
export async function updateVenue(input: unknown): Promise<void> {
  const parsed = updateVenueSchema.parse(input);
  const orgId = await requireOrgId();

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('venues')
    .update({
      name: parsed.name,
      address: parsed.address ?? null,
      website: parsed.website ?? null,
      phone: parsed.phone ?? null,
      contact: parsed.contact ?? null,
      rings: parsed.rings,
      stables: parsed.stables,
    })
    .eq('id', parsed.id)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/venues');
}

/**
 * Removes a venue from the library — showstaff.html's deleteLocationAction.
 * No in-use guard here, matching legacy's own DELETE handler
 * (api/organizations/[id]/[resource].js lines 902-967) and `shows.venue_id`'s
 * `on delete set null`: a show that already picked up this venue's ring
 * layout keeps what it copied and simply loses the back-link, exactly as
 * legacy's own confirm() copy promises ("Shows that already used its ring
 * layout keep what they have"). The obvious-guard the caller actually wants
 * — not silently nuking a venue three live shows depend on — is a confirm
 * dialog naming what's attached, which belongs client-side where the show
 * count is already known (see venue-list.tsx), not a hard server-side block
 * legacy never had either.
 */
export async function deleteVenue(input: unknown): Promise<void> {
  const parsed = deleteVenueSchema.parse(input);
  const orgId = await requireOrgId();

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', parsed.id)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/venues');
}
