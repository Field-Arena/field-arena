'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/shared/types/database.types';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { env } from '@/shared/lib/env';
import { sendEmail } from '@/shared/lib/email';
import { ROUTES } from '@/shared/constants/routes';
import { ROLE_PERMISSION_DEFAULTS, PERMISSION_KEYS } from '@/shared/constants/permissions';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationFlagSchema,
  resendOrganizerInviteSchema,
  addOrganizationOwnerSchema,
  removeOrganizationOwnerSchema,
  addSuperAdminSchema,
  superAdminIdSchema,
  addOrgStaffSchema,
  changeStaffRoleSchema,
  updateStaffPermissionsSchema,
  staffIdSchema,
  createLeadSchema,
  updateSettlementSchema,
  updateLeadSchema,
  leadIdSchema,
  toggleChecklistItemSchema,
  createSheetSchema,
  updateSheetSchema,
  sheetIdSchema,
  uploadDocumentSchema,
  documentIdSchema,
  moveDocumentSchema,
  moveDocumentsSchema,
  renameDocumentSchema,
  rematchDocumentsSchema,
} from '@/modules/superadmin/schemas';
import {
  ONBOARDING_CHECKLIST_TEMPLATE,
  CONSOLE_PATH,
  USERS_PATH,
  SALES_PATH,
  CATALOG_PATH,
  DOCUMENTS_PATH,
  DOCS_BUCKET,
} from '@/modules/superadmin/constants';
import {
  fail,
  type CreateOrganizationResult,
  type AddSuperAdminResult,
} from '@/modules/superadmin/data/action-result';

/* Every mutation in this module is SuperAdmin-only, exactly as the legacy
 * console's routes were (requireSuperAdmin in api/_lib/auth.js guarded all of
 * api/organizations.js, api/leads.js and the catalog/doc resources). RLS alone
 * is NOT enough here: organizations_update_own also grants an Organizer full
 * update rights on their own org row, so an unguarded Server Action would let
 * an Organizer un-suspend or un-delete themselves and rewrite their own
 * fee_model / holdback_percent. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function requireSuperAdmin() {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'SuperAdmin') {
    throw new Error('Only a Super Admin can perform this action.');
  }
  return profile;
}

export async function createOrganization(input: unknown): Promise<CreateOrganizationResult> {
  const parsedResult = createOrganizationSchema.safeParse(input);
  if (!parsedResult.success) {
    return fail(parsedResult.error.issues[0]?.message ?? 'Please check the form and try again.');
  }
  const parsed = parsedResult.data;
  const name = [parsed.contactFirstName, parsed.contactLastName].filter(Boolean).join(' ');
  const normalizedEmail = parsed.contactEmail.trim().toLowerCase();

  const admin = createAdminClient();

  const [{ data: existingUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', normalizedEmail).maybeSingle(),
    admin.from('riders').select('id').eq('email', normalizedEmail).maybeSingle(),
  ]);
  if (existingUser || existingRider) {
    return fail('A user with this email already exists.');
  }

  const { data: nameClash } = await admin
    .from('organizations')
    .select('id')
    .ilike('name', parsed.name.trim())
    .is('deleted_at', null)
    .maybeSingle();
  if (nameClash) {
    return fail(`An organizer named “${parsed.name.trim()}” already exists.`);
  }

  const supabase = await createServerClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: parsed.name,
      city: parsed.city ?? null,
      region: parsed.region ?? null,
      country: parsed.country ?? null,
      email: parsed.contactEmail,
      fee_model: parsed.feeModel,

      is_demo: false,
    })
    .select('id, name')
    .single();

  if (error) return fail(error.message);

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: { name, next: ROUTES.onboarding },

      redirectTo: env.siteUrl,
    },
  );
  if (inviteError) {
    revalidatePath(CONSOLE_PATH);
    return fail(
      `Organization "${org.name}" was created, but its owner invite could not be sent (${inviteError.message}). Use Resend invite to try again.`,
    );
  }

  const { error: profileError } = await admin.from('users').insert({
    id: invited.user.id,
    name,
    email: normalizedEmail,
    platform_role: 'Organizer',
    org_id: org.id,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    revalidatePath(CONSOLE_PATH);
    return fail(
      `Organization "${org.name}" was created, but its owner account could not be provisioned (${profileError.message}).`,
    );
  }

  revalidatePath(CONSOLE_PATH);
  return { ok: true, id: org.id, name: org.name };
}

export async function resendOrganizerInvite(input: unknown): Promise<{ email: string }> {
  await requireSuperAdmin();
  const { orgId } = resendOrganizerInviteSchema.parse(input);
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('id, name, email')
    .eq('id', orgId)
    .single();
  if (orgError) throw new Error(orgError.message);

  const { data: owner, error: ownerError } = await admin
    .from('users')
    .select('id, name, email, onboarded_at')
    .eq('org_id', orgId)
    .eq('platform_role', 'Organizer')
    .maybeSingle();
  if (ownerError) throw new Error(ownerError.message);

  const email = owner?.email ?? org.email;
  if (!email) {
    throw new Error('This organization has no contact email on file to invite.');
  }
  const name = owner?.name ?? org.name;

  if (owner?.onboarded_at) {
    throw new Error('This organization’s owner has already finished setting up their account.');
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, next: ROUTES.onboarding },

    redirectTo: env.siteUrl,
  });
  if (inviteError) throw new Error(inviteError.message);

  if (!owner) {
    const { error: profileError } = await admin.from('users').insert({
      id: invited.user.id,
      name,
      email,
      platform_role: 'Organizer',
      org_id: orgId,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(invited.user.id);
      throw new Error(profileError.message);
    }
  }

  revalidatePath(CONSOLE_PATH);
  return { email };
}

/* Client feedback: an Organizer's home org is a single FK, so someone
 * running two separate show-organizing businesses needed two logins. This
 * grants a SECOND (or further) organization to an existing Organizer
 * account without touching their primary org_id — see
 * 20260907170000_organization_owners.sql for how RLS honours the grant.
 * SuperAdmin-only, deliberately: letting an Organizer grant this to
 * themselves would let anyone claim any organization's data. */
export async function addOrganizationOwner(
  input: unknown,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  await requireSuperAdmin();
  const parsed = addOrganizationOwnerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }
  const { orgId, email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const admin = createAdminClient();
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, name, platform_role, org_id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (userError) return { ok: false, error: userError.message };
  if (!user) {
    return {
      ok: false,
      error: 'No Organizer account exists with that email yet — add them as an organizer first.',
    };
  }
  if (user.platform_role !== 'Organizer') {
    return { ok: false, error: `${user.name} is not an Organizer account.` };
  }
  if (user.org_id === orgId) {
    return { ok: false, error: `${user.name} already owns this organization.` };
  }

  const { error: insertError } = await admin
    .from('organization_owners')
    .insert({ org_id: orgId, user_id: user.id });
  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: `${user.name} already has access to this organization.` };
    }
    return { ok: false, error: insertError.message };
  }

  revalidatePath(CONSOLE_PATH);
  return { ok: true, email: normalizedEmail };
}

export async function removeOrganizationOwner(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { orgId, userId } = removeOrganizationOwnerSchema.parse(input);

  const admin = createAdminClient();
  const { error } = await admin
    .from('organization_owners')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
  return { ok: true };
}

/* Bulk "Resend Invite (All Pending)" -- legacy resendAllPendingInvites().
 * Deliberately sequential rather than Promise.all: a slow or failing provider
 * shouldn't be stampeded, and a partial failure has to stay attributable to a
 * named org. Returns the same shape legacy summarised in its alert(). */
export async function resendAllPendingOrganizerInvites(): Promise<{
  sent: number;
  total: number;
  failed: string[];
}> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const [{ data: orgs, error: orgsError }, { data: owners, error: ownersError }] =
    await Promise.all([
      admin.from('organizations').select('id, name, email').is('deleted_at', null),
      admin.from('users').select('org_id, onboarded_at').eq('platform_role', 'Organizer'),
    ]);
  if (orgsError) throw new Error(orgsError.message);
  if (ownersError) throw new Error(ownersError.message);

  const onboardedOrgIds = new Set(
    owners.filter((o) => o.onboarded_at && o.org_id).map((o) => o.org_id),
  );
  const pending = orgs.filter((o) => !onboardedOrgIds.has(o.id));

  const failed: string[] = [];
  let sent = 0;
  for (const org of pending) {
    try {
      await resendOrganizerInvite({ orgId: org.id });
      sent += 1;
    } catch {
      failed.push(org.name);
    }
  }

  revalidatePath(CONSOLE_PATH);
  return { sent, total: pending.length, failed };
}

export async function updateOrganization(input: unknown) {
  await requireSuperAdmin();
  const parsed = updateOrganizationSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('organizations')
    .update({
      name: parsed.name,
      email: parsed.email === '' ? null : (parsed.email ?? null),
      phone: parsed.phone ?? null,
      website: parsed.website ?? null,
      city: parsed.city ?? null,
      region: parsed.region ?? null,
      country: parsed.country ?? null,
      fee_model: parsed.feeModel,
    })
    .eq('id', parsed.id);

  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
}

export async function setOrganizationSuspended(input: unknown) {
  await requireSuperAdmin();
  const { id, value } = organizationFlagSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('organizations').update({ suspended: value }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
}

export async function setOrganizationDeleted(input: unknown) {
  await requireSuperAdmin();
  const { id, value } = organizationFlagSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('organizations')
    .update({ deleted_at: value ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
}

export async function addSuperAdmin(input: unknown): Promise<AddSuperAdminResult> {
  await requireSuperAdmin();
  const parsedResult = addSuperAdminSchema.safeParse(input);
  if (!parsedResult.success) {
    return fail(parsedResult.error.issues[0]?.message ?? 'Please check the form and try again.');
  }
  const { name, email } = parsedResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existing) {
    return fail('A user with this email already exists.');
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: { name, next: USERS_PATH },

      redirectTo: env.siteUrl,
    },
  );
  if (inviteError) {
    return fail(
      /already.*regist|exist/i.test(inviteError.message)
        ? 'That email already has an account. It can only be added as a Super Admin from the database, not through this invite.'
        : inviteError.message,
    );
  }

  const { error: insertError } = await admin.from('users').insert({
    id: invited.user.id,
    name,
    email: normalizedEmail,
    platform_role: 'SuperAdmin',
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return fail(insertError.message);
  }

  revalidatePath(USERS_PATH);
  return { ok: true, email: normalizedEmail };
}

export async function removeSuperAdmin(input: unknown): Promise<{ ok: true }> {
  const caller = await requireSuperAdmin();
  const { id } = superAdminIdSchema.parse(input);

  if (id === caller.id) {
    throw new Error("You can't remove your own account.");
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from('users')
    .select('id, platform_role')
    .eq('id', id)
    .maybeSingle();
  if (target?.platform_role !== 'SuperAdmin') {
    throw new Error('Super Admin not found.');
  }

  const { count } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('platform_role', 'SuperAdmin');
  if ((count ?? 0) <= 1) {
    throw new Error("Can't remove the last remaining Super Admin.");
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

function platformRoleForStaff(role: string): string {
  return role === 'Show Admin' ? 'ShowAdmin' : role;
}

async function sendStaffInviteNotification(params: {
  to: string;
  name: string;
  role: string;
  showName: string;
}): Promise<boolean> {
  const firstName = params.name.trim().split(/\s+/)[0] ?? params.name;
  const link = `${env.siteUrl}${ROUTES.login}`;

  return sendEmail({
    to: params.to,
    subject: `You've been added as ${params.role} for ${params.showName}`,
    html:
      `<p>Hi ${escapeHtml(firstName)},</p>` +
      `<p>You've been added as <b>${escapeHtml(params.role)}</b> for ` +
      `<b>${escapeHtml(params.showName)}</b>. Click below to log in and get set up:</p>` +
      `<p><a href="${link}">${link}</a></p>`,
  });
}

/* Role defaults are written onto the row at creation time rather than left
 * empty and resolved on read -- same reason legacy's POST /api/shows/:id/staff
 * stores defaultsForRole(role): the permissions popup then has real,
 * self-contained values to show and edit from the moment the person is added,
 * and a later role change can't silently re-derive someone's access. */
function defaultPermissionsForRole(role: string): Record<string, boolean> {
  const defaults = ROLE_PERMISSION_DEFAULTS[role] ?? {};
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, defaults[k] === true]));
}

export async function addOrgStaff(input: unknown): Promise<{ email: string; emailSent: boolean }> {
  await requireSuperAdmin();
  const parsed = addOrgStaffSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const name = parsed.name.trim();
  const nameParts = name.split(/\s+/);
  const firstName = parsed.firstName.trim() || (nameParts[0] ?? name);
  const lastName = parsed.lastName.trim() || nameParts.slice(1).join(' ') || null;

  const supabase = await createServerClient();
  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('name')
    .eq('id', parsed.showId)
    .single();
  if (showError) throw new Error(showError.message);

  const { error: assignError } = await supabase.from('staff_assignments').insert({
    show_id: parsed.showId,
    email,
    name,
    first_name: firstName,
    last_name: lastName,
    role: parsed.role,
    permissions: defaultPermissionsForRole(parsed.role),
    status: 'pending',
  });
  if (assignError) throw new Error(assignError.message);

  const admin = createAdminClient();
  const [{ data: existingStaffUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);

  // The staff row is real either way -- a failed send is surfaced, never
  // rolled back (same stance as legacy's POST /api/shows/:id/staff, which
  // returns { ...row, emailSent }). Silently swallowing this was how a failed
  // invite became indistinguishable from a delivered one.
  let emailSent = false;
  if (existingStaffUser || existingRider) {
    // Link the assignment to the real account. getUserWorkspaceRoles() matches
    // staff_assignments on user_id, so without this the multi-role workspace
    // switcher never offers this person the role they were just given — they
    // hold it, but the rail can't see it. Mirrors provisionIfNewAccount() on
    // the organizer's own add-staff path.
    if (existingStaffUser) {
      await admin
        .from('staff_assignments')
        .update({ user_id: existingStaffUser.id })
        .eq('email', email)
        .is('user_id', null);
    }
    emailSent = await sendStaffInviteNotification({
      to: email,
      name,
      role: parsed.role,
      showName: show.name,
    });
  } else {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        firstName,
        role: parsed.role,
        showName: show.name,
      },

      redirectTo: env.siteUrl,
    });

    if (!inviteError) {
      emailSent = true;
      await admin.from('users').insert({
        id: invited.user.id,
        name,
        email,
        platform_role: platformRoleForStaff(parsed.role),
      });
      await admin
        .from('staff_assignments')
        .update({ user_id: invited.user.id })
        .eq('email', email)
        .is('user_id', null);
    }
  }

  revalidatePath(USERS_PATH);
  return { email, emailSent };
}

export async function changeStaffRole(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { staffId, role } = changeStaffRoleSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('staff_assignments').update({ role }).eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function updateStaffPermissions(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { staffId, permissions } = updateStaffPermissionsSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('staff_assignments')
    .update({ permissions })
    .eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function removeStaffAssignment(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { staffId } = staffIdSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('staff_assignments').delete().eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value) return value;
  return null;
}

export async function createLead(input: unknown): Promise<{ id: string }> {
  await requireSuperAdmin();
  const parsed = createLeadSchema.parse(input);
  const supabase = await createServerClient();

  const showsNumber = parsed.showsPerYear ? Number(parsed.showsPerYear) : null;
  const showsPerYear =
    showsNumber != null && Number.isFinite(showsNumber) && showsNumber >= 0
      ? Math.floor(showsNumber)
      : null;

  const { data, error } = await supabase
    .from('leads')
    .insert({
      org_name: parsed.orgName,
      contact_name: parsed.contactName ?? null,
      email: parsed.email ? parsed.email.toLowerCase() : null,
      phone: parsed.phone ?? null,
      website: parsed.website ?? null,
      shows_per_year: showsPerYear,
      status: 'new',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(SALES_PATH);
  return { id: data.id };
}

export async function updateLead(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const parsed = updateLeadSchema.parse(input);
  const { id } = parsed;

  const updates: Database['public']['Tables']['leads']['Update'] = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.orgName !== undefined) updates.org_name = parsed.orgName;
  if (parsed.contactName !== undefined) updates.contact_name = emptyToNull(parsed.contactName);
  if (parsed.email !== undefined) updates.email = parsed.email ? parsed.email.toLowerCase() : null;
  if (parsed.phone !== undefined) updates.phone = emptyToNull(parsed.phone);
  if (parsed.website !== undefined) updates.website = emptyToNull(parsed.website);
  if (parsed.status !== undefined) updates.status = parsed.status;
  if (parsed.notes !== undefined) updates.notes = emptyToNull(parsed.notes);
  if (parsed.showsPerYear !== undefined) updates.shows_per_year = parsed.showsPerYear;
  if (parsed.costPerEvent !== undefined) updates.cost_per_event = parsed.costPerEvent;
  if (parsed.avgRevenuePerShow !== undefined)
    updates.avg_revenue_per_show = parsed.avgRevenuePerShow;
  if (parsed.onboardingAt !== undefined) {
    updates.onboarding_at = parsed.onboardingAt
      ? new Date(parsed.onboardingAt).toISOString()
      : null;
  }
  if (parsed.onboardingChecklist !== undefined) {
    updates.onboarding_checklist = parsed.onboardingChecklist;
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from('leads').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(SALES_PATH);
  revalidatePath(`${SALES_PATH}/${id}`);
  return { ok: true };
}

/* Toggling one checklist item re-reads the stored list, flips that one entry,
 * and writes the whole array back — legacy toggleLeadChecklistItem did the
 * same re-fetch for the same reason: sending a client-held copy overwrites any
 * edit made elsewhere since the page rendered. */
export async function toggleLeadChecklistItem(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { id, itemId, done } = toggleChecklistItemSchema.parse(input);
  const supabase = await createServerClient();

  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('onboarding_checklist')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!lead) throw new Error('Lead not found.');

  const existing = Array.isArray(lead.onboarding_checklist) ? lead.onboarding_checklist : [];
  const next = existing.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return item.id === itemId ? { ...item, done } : item;
  });

  const { error } = await supabase
    .from('leads')
    .update({ onboarding_checklist: next, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`${SALES_PATH}/${id}`);
  return { ok: true };
}

export async function sendLeadOnboarding(input: unknown): Promise<{ emailSent: boolean }> {
  const { id } = leadIdSchema.parse(input);
  const supabase = await createServerClient();

  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('onboarding_checklist, email, contact_name, onboarding_at')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!lead) throw new Error('Lead not found.');

  const existing = Array.isArray(lead.onboarding_checklist) ? lead.onboarding_checklist : [];
  const checklist =
    existing.length > 0
      ? existing
      : ONBOARDING_CHECKLIST_TEMPLATE.map((label, index) => ({
          id: `ob${String(index)}`,
          label,
          done: false,
        }));

  // Legacy sendOnboardingEmail (api/leads.js): the checklist is rendered into
  // the body as a <ul> and the onboarding slot is spelled out in full. The
  // send happens BEFORE onboarding_email_sent_at is stamped -- stamping a
  // "we emailed them" timestamp for an email that never went out is worse
  // than not stamping at all.
  const rows = checklist
    .map((c) => {
      const label = (c as { label?: unknown }).label;
      return `<li>${escapeHtml(typeof label === 'string' ? label : '')}</li>`;
    })
    .join('');
  const whenText = lead.onboarding_at
    ? new Date(lead.onboarding_at).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : 'your scheduled onboarding session';

  let emailSent = false;
  if (lead.email) {
    emailSent = await sendEmail({
      to: lead.email,
      subject: 'Getting ready for your Field & Arena onboarding',
      html:
        `<p>Hi ${escapeHtml(lead.contact_name ?? 'there')},</p>` +
        `<p>We're looking forward to your onboarding on <b>${escapeHtml(whenText)}</b>. ` +
        `To make the most of that time, please have the following ready beforehand:</p>` +
        `<ul>${rows}</ul>` +
        `<p>If anything on this list isn't ready yet, no problem — just bring what you have ` +
        `and we'll sort out the rest together.</p>` +
        `<p>See you soon!</p>`,
    });
  }

  const updates: Database['public']['Tables']['leads']['Update'] = {
    onboarding_checklist: checklist,
    updated_at: new Date().toISOString(),
  };
  if (emailSent) updates.onboarding_email_sent_at = new Date().toISOString();

  const { error } = await supabase.from('leads').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`${SALES_PATH}/${id}`);
  return { emailSent };
}

export async function createScoringSheet(input: unknown): Promise<{ id: string }> {
  await requireSuperAdmin();
  const parsed = createSheetSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('scoring_catalog')
    .insert({
      title: parsed.title,
      level: parsed.level ?? null,
      discipline: parsed.discipline ?? 'Dressage',
      family: parsed.family,
      governing_body: parsed.governingBody ?? null,
      source_file: parsed.sourceFile ?? null,

      source: null,
      def: {},
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  return { id: data.id };
}

export async function updateScoringSheet(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const parsed = updateSheetSchema.parse(input);
  const { id } = parsed;

  const updates: Database['public']['Tables']['scoring_catalog']['Update'] = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.title !== undefined) updates.title = parsed.title;
  if (parsed.level !== undefined) updates.level = emptyToNull(parsed.level);
  if (parsed.discipline !== undefined) updates.discipline = parsed.discipline;
  if (parsed.family !== undefined) updates.family = parsed.family;
  if (parsed.governingBody !== undefined)
    updates.governing_body = emptyToNull(parsed.governingBody);
  if (parsed.source !== undefined) updates.source = emptyToNull(parsed.source);
  if (parsed.def !== undefined) {
    updates.def = parsed.def as Database['public']['Tables']['scoring_catalog']['Update']['def'];
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from('scoring_catalog').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  revalidatePath(`${CATALOG_PATH}/${id}`);
  return { ok: true };
}

export async function deleteScoringSheet(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { id } = sheetIdSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('scoring_catalog').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  return { ok: true };
}

export async function uploadCatalogDocument(input: unknown): Promise<{ id: string }> {
  await requireSuperAdmin();
  const parsed = uploadDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.folder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(path, bytes, {
    contentType: parsed.contentType ?? 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('catalog_documents')
    .insert({ folder: parsed.folder, name: parsed.name, path })
    .select('id')
    .single();
  if (error) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(DOCUMENTS_PATH);
  return { id: data.id };
}

export async function deleteCatalogDocument(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { id } = documentIdSchema.parse(input);
  const supabase = await createServerClient();

  const { data: row } = await supabase
    .from('catalog_documents')
    .select('path')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('catalog_documents').delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (row?.path) {
    await supabase.storage.from(DOCS_BUCKET).remove([row.path]);
  }

  revalidatePath(DOCUMENTS_PATH);
  return { ok: true };
}

export async function moveCatalogDocument(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { id, folder } = moveDocumentSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('catalog_documents').update({ folder }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(DOCUMENTS_PATH);
  return { ok: true };
}

/* "Try to match again" -- once the catalog or the matcher improves, an
 * already-uploaded file can be pointed at its catalog entry by renaming the
 * row to that entry's source_file. Same row, same stored object, no re-upload
 * (legacy rematchUnmatchedUploads). */
export async function renameCatalogDocument(input: unknown): Promise<{ ok: true }> {
  await requireSuperAdmin();
  const { id, name } = renameDocumentSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('catalog_documents').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(DOCUMENTS_PATH);
  revalidatePath(CATALOG_PATH);
  return { ok: true };
}

/* Bulk counterpart of the two single-row actions above, so a pile of unmatched
 * uploads can be resolved in one pass instead of one click each. Best-effort
 * per row -- the caller re-reads and shows whatever actually landed. */
export async function rematchCatalogDocuments(input: unknown): Promise<{
  fixed: number;
  failed: number;
}> {
  await requireSuperAdmin();
  const { renames } = rematchDocumentsSchema.parse(input);
  const supabase = await createServerClient();

  let fixed = 0;
  let failed = 0;
  for (const item of renames) {
    const { error } = await supabase
      .from('catalog_documents')
      .update({ name: item.name })
      .eq('id', item.id);
    if (error) failed += 1;
    else fixed += 1;
  }

  revalidatePath(DOCUMENTS_PATH);
  revalidatePath(CATALOG_PATH);
  return { fixed, failed };
}

export async function moveCatalogDocuments(input: unknown): Promise<{ moved: number }> {
  await requireSuperAdmin();
  const { ids, folder } = moveDocumentsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('catalog_documents').update({ folder }).in('id', ids);
  if (error) throw new Error(error.message);

  revalidatePath(DOCUMENTS_PATH);
  return { moved: ids.length };
}

export async function updateSettlement(input: unknown): Promise<void> {
  await requireSuperAdmin();
  const data = updateSettlementSchema.parse(input);

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      payout_cadence: data.payoutCadence,

      holdback_percent: data.holdbackPercent === 0 ? null : data.holdbackPercent,
    })
    .eq('id', data.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/superadmin/billing/${data.id}`);
  revalidatePath('/dashboard/superadmin/billing');
}
