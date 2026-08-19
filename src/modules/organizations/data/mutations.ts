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

async function requireOrgId(): Promise<string> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const impersonatedOrgId = await getImpersonatedOrgId();
  const orgId = impersonatedOrgId ?? profile.org_id;
  if (!orgId) throw new Error('Your account is not the owner of an organization.');
  return orgId;
}

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

export async function deleteVenue(input: unknown): Promise<void> {
  const parsed = deleteVenueSchema.parse(input);
  const orgId = await requireOrgId();

  const supabase = await createServerClient();
  const { error } = await supabase.from('venues').delete().eq('id', parsed.id).eq('org_id', orgId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/venues');
}

function memberError(error: { code?: string; message: string }, email?: string): string {
  if (error.code === '23505') {
    return email
      ? `${email} is already in your organization's database. Search for them to edit that record instead.`
      : "Someone in that list is already in your organization's database.";
  }
  return error.message;
}

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
    existing.map((m) => m.email?.trim().toLowerCase()).filter((e): e is string => !!e),
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

export async function addMembersToShow(
  input: unknown,
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
    staff.data.map((s) => s.email?.trim().toLowerCase()).filter((e): e is string => !!e),
  );
  const vendorEmails = new Set(
    vendors.data.map((v) => v.contact?.trim().toLowerCase()).filter((e): e is string => !!e),
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
  const vendorRows: {
    show_id: string;
    name: string;
    contact: string | null;
    phone: string | null;
  }[] = [];

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

  if (accountId) {
    try {
      await stripe.accounts.retrieve(accountId);
    } catch (error) {
      if (!isStaleAccountError(error)) throw error;
      accountId = null;
    }
  }

  if (!accountId) {
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

    return_url: `${env.siteUrl}/dashboard/billing?connect=done`,
    refresh_url: `${env.siteUrl}/dashboard/billing?connect=refresh`,
  });

  revalidatePath('/dashboard/billing');
  return { url: link.url };
}
