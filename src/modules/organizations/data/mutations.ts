'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { getStripeClient, isStripeConfigured } from '@/shared/lib/stripe';
import { isStaleAccountError } from '@/shared/lib/stripe-errors';
import { env } from '@/shared/lib/env';
import {
  completeOrgProfileSchema,
  addOrgMemberSchema,
  createVenueSchema,
  updateVenueSchema,
  deleteVenueSchema,
  createMemberSchema,
  updateMemberSchema,
  memberIdSchema,
  importMembersSchema,
  addMembersToShowSchema,
} from '@/modules/organizations/schemas';
import { MEMBERS_PATH } from '@/modules/organizations/constants';

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

/* ── Member Database ─────────────────────────────────────────────────────── */

/**
 * A message a person can act on, from a member write.
 *
 * member_database has a unique index on (org_id, email), so re-adding someone
 * already in the database fails with Postgres's own
 * "duplicate key value violates unique constraint" — accurate, and useless to
 * an organizer who just wants to know they are already on the list.
 */
function memberError(error: { code?: string; message: string }, email?: string): string {
  if (error.code === '23505') {
    return email
      ? `${email} is already in your organization's database. Search for them to edit that record instead.`
      : "Someone in that list is already in your organization's database.";
  }
  return error.message;
}

/** The column set every member write shares, from the parsed input. */
function memberRow(parsed: {
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  email?: string;
  phone?: string;
  membershipStatus: string;
  membershipExpires?: string;
  notes?: string;
  extraFields?: Record<string, string>;
}) {
  return {
    name: parsed.name,
    first_name: parsed.firstName ?? null,
    last_name: parsed.lastName ?? null,
    role: parsed.role,
    email: parsed.email === '' ? null : (parsed.email ?? null),
    phone: parsed.phone ?? null,
    membership_status: parsed.membershipStatus,
    membership_expires: parsed.membershipExpires === '' ? null : (parsed.membershipExpires ?? null),
    notes: parsed.notes ?? null,
    extra_fields: parsed.extraFields ?? {},
  };
}

export async function createMember(input: unknown): Promise<{ id: string }> {
  const parsed = createMemberSchema.parse(input);
  const orgId = await requireOrgId();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('member_database')
    .insert({ org_id: orgId, ...memberRow(parsed) })
    .select('id')
    .single();
  if (error) throw new Error(memberError(error, parsed.email));

  revalidatePath(MEMBERS_PATH);
  return { id: data.id };
}

export async function updateMember(input: unknown): Promise<void> {
  const parsed = updateMemberSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('member_database')
    .update(memberRow(parsed))
    .eq('id', parsed.id);
  if (error) throw new Error(memberError(error, parsed.email));

  revalidatePath(MEMBERS_PATH);
}

export async function deleteMember(input: unknown): Promise<void> {
  const { id } = memberIdSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('member_database').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(MEMBERS_PATH);
}

/**
 * Bulk import from an uploaded list.
 *
 * Rows whose email already exists in this organization are skipped rather than
 * duplicated — re-uploading a slightly longer list is the normal way people use
 * this, and it should add the new names, not a second copy of everyone.
 */
export async function importMembers(input: unknown): Promise<{ added: number; skipped: number }> {
  const parsed = importMembersSchema.parse(input);
  const orgId = await requireOrgId();
  const supabase = await createServerClient();

  const { data: existing, error: readError } = await supabase
    .from('member_database')
    .select('email')
    .eq('org_id', orgId);
  if (readError) throw new Error(readError.message);

  const seen = new Set(
    existing.map((m) => m.email?.trim().toLowerCase()).filter((e): e is string => !!e)
  );

  const rows: ReturnType<typeof memberRow>[] = [];
  let skipped = 0;
  for (const row of parsed.rows) {
    const email = row.email?.trim().toLowerCase();
    if (email && seen.has(email)) {
      skipped++;
      continue;
    }
    if (email) seen.add(email);
    rows.push(memberRow(row));
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('member_database')
      .insert(rows.map((r) => ({ org_id: orgId, ...r })));
    if (error) throw new Error(memberError(error));
  }

  revalidatePath(MEMBERS_PATH);
  return { added: rows.length, skipped };
}

/**
 * Copies selected members into a show.
 *
 * "Copies" is the word the legacy screen uses and it is accurate — the member
 * stays in the database either way. Where they land depends on their type:
 *
 *  - Vendor → a vendor booking on that show
 *  - Organizer → skipped; an organizer is not a per-show staffing row
 *  - Rider → skipped, and this is a real departure from the legacy build. There,
 *    a rider was a plain row anyone could create; here `riders` keys off
 *    auth.users, so a rider cannot exist without an account. Inventing one would
 *    mean an account nobody can sign into.
 *  - everything else → a staff assignment, with the generic "Member" mapped to
 *    ShowStaff, matching the legacy mapping
 *
 * Anyone already on the show by email is skipped, so running this twice does
 * not double them up.
 */
export async function addMembersToShow(
  input: unknown
): Promise<{ added: number; skipped: number; ridersSkipped: number }> {
  const parsed = addMembersToShowSchema.parse(input);
  const supabase = await createServerClient();

  const [members, staff, vendors] = await Promise.all([
    supabase
      .from('member_database')
      .select('id, name, first_name, last_name, email, phone, role')
      .in('id', parsed.memberIds),
    supabase.from('staff_assignments').select('email').eq('show_id', parsed.showId),
    supabase.from('vendor_bookings').select('contact').eq('show_id', parsed.showId),
  ]);
  if (members.error) throw new Error(members.error.message);
  if (staff.error) throw new Error(staff.error.message);
  if (vendors.error) throw new Error(vendors.error.message);

  const staffEmails = new Set(
    staff.data.map((s) => s.email?.trim().toLowerCase()).filter((e): e is string => !!e)
  );
  const vendorEmails = new Set(
    vendors.data.map((v) => v.contact?.trim().toLowerCase()).filter((e): e is string => !!e)
  );

  const staffRows: {
    show_id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    email: string | null;
    phone: string | null;
  }[] = [];
  const vendorRows: { show_id: string; name: string; contact: string | null; phone: string | null }[] =
    [];

  let skipped = 0;
  let ridersSkipped = 0;

  for (const member of members.data) {
    const email = member.email?.trim().toLowerCase() ?? '';

    if (member.role === 'Rider') {
      ridersSkipped++;
      continue;
    }
    if (member.role === 'Organizer') {
      skipped++;
      continue;
    }

    if (member.role === 'Vendor') {
      if (email && vendorEmails.has(email)) {
        skipped++;
        continue;
      }
      if (email) vendorEmails.add(email);
      vendorRows.push({
        show_id: parsed.showId,
        // member_database.name is NOT NULL, but the generated row type widens
        // it — the fallback keeps vendor_bookings.name's own NOT NULL honest.
        name: member.name || 'Vendor',
        contact: member.email,
        phone: member.phone,
      });
      continue;
    }

    if (email && staffEmails.has(email)) {
      skipped++;
      continue;
    }
    if (email) staffEmails.add(email);
    staffRows.push({
      show_id: parsed.showId,
      name: member.name || 'Staff',
      first_name: member.first_name,
      last_name: member.last_name,
      // ShowStaff both for the generic "Member" and for a member whose type was
      // never set — staff_assignments.role is NOT NULL and needs a real seat.
      role: !member.role || member.role === 'Member' ? 'ShowStaff' : member.role,
      email: member.email,
      phone: member.phone,
    });
  }

  if (staffRows.length > 0) {
    const { error } = await supabase.from('staff_assignments').insert(staffRows);
    if (error) throw new Error(error.message);
  }
  if (vendorRows.length > 0) {
    const { error } = await supabase.from('vendor_bookings').insert(vendorRows);
    if (error) throw new Error(error.message);
  }

  revalidatePath(MEMBERS_PATH);
  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  return { added: staffRows.length + vendorRows.length, skipped, ridersSkipped };
}

/**
 * Starts — or resumes — Stripe Connect Express onboarding, ported from
 * POST /api/organizations/:id/connect.
 *
 * Returns the hosted Stripe URL for the caller to send the browser to. The
 * organization is `requireOrgId()`'s, never one named in the request: creating
 * a Connect account against someone else's organization would attach their
 * payouts to a bank account the caller controls.
 *
 * The account is created once and its id stored; calling this again for an
 * organization that abandoned onboarding half-way mints a fresh link onto the
 * SAME account rather than a second one, because Stripe account links expire
 * after a few minutes and a resumed onboarding must not start over.
 */
export async function startStripeConnect(): Promise<{ url: string }> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured on this environment yet.');
  }

  const orgId = await requireOrgId();
  const supabase = await createServerClient();

  const { data: org, error: readError } = await supabase
    .from('organizations')
    .select('email, stripe_connect_account_id')
    .eq('id', orgId)
    .single();
  if (readError) throw new Error(readError.message);

  const stripe = getStripeClient();
  let accountId = org.stripe_connect_account_id;

  /**
   * A stored account id is only good for the platform that created it.
   *
   * Swapping STRIPE_SECRET_KEY — a different client's account, or the eventual
   * test-to-live cutover — leaves every stored `acct_...` pointing at another
   * platform's account, and Stripe rejects both retrieving it and minting a
   * link for it. Rather than dead-ending on "not connected to your platform",
   * the id is dropped and a fresh account is created under the current keys.
   *
   * Only a 4xx from Stripe counts. A network failure or an outage must NOT
   * discard a perfectly good account id and start the organizer's onboarding
   * over — so anything else is rethrown.
   */
  if (accountId) {
    try {
      await stripe.accounts.retrieve(accountId);
    } catch (error) {
      if (!isStaleAccountError(error)) throw error;
      accountId = null;
    }
  }

  if (!accountId) {
    // US-only at launch, and both capabilities requested up front: card_payments
    // because Field & Arena is merchant of record, transfers because the payout
    // is a separate transfer afterward.
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: org.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    const { error } = await supabase
      .from('organizations')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', orgId);
    if (error) throw new Error(error.message);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    // Stripe sends the organizer back here either way: return_url when they
    // finish, refresh_url when the link expired before they did.
    return_url: `${env.siteUrl}/dashboard/billing?connect=done`,
    refresh_url: `${env.siteUrl}/dashboard/billing?connect=refresh`,
  });

  revalidatePath('/dashboard/billing');
  return { url: link.url };
}
