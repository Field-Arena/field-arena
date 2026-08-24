'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/shared/types/database.types';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationFlagSchema,
  resendOrganizerInviteSchema,
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
  createSheetSchema,
  updateSheetSchema,
  sheetIdSchema,
  uploadDocumentSchema,
  documentIdSchema,
  moveDocumentSchema,
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

async function requireSuperAdmin() {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'SuperAdmin') {
    throw new Error('Only a Super Admin can manage Super Admins.');
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
    .select('id, name, email')
    .eq('org_id', orgId)
    .eq('platform_role', 'Organizer')
    .maybeSingle();
  if (ownerError) throw new Error(ownerError.message);

  const email = owner?.email ?? org.email;
  if (!email) {
    throw new Error('This organization has no contact email on file to invite.');
  }
  const name = owner?.name ?? org.name;

  if (owner) {
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(owner.id);
    if (authError) throw new Error(authError.message);
    if (authUser.user.last_sign_in_at) {
      throw new Error('This organization’s owner has already signed in.');
    }
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

export async function updateOrganization(input: unknown) {
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
  const { id, value } = organizationFlagSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('organizations').update({ suspended: value }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
}

export async function setOrganizationDeleted(input: unknown) {
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
}): Promise<void> {
  const firstName = params.name.trim().split(/\s+/)[0] ?? params.name;
  const link = `${env.siteUrl}${ROUTES.login}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Field & Arena <notifications@field-arena.com>',
      to: params.to,
      subject: `You've been added as ${params.role} for ${params.showName}`,
      html:
        `<p>Hi ${firstName},</p>` +
        `<p>You've been added as <b>${params.role}</b> for <b>${params.showName}</b>. ` +
        `Click below to log in and get set up:</p>` +
        `<p><a href="${link}">${link}</a></p>`,
    }),
  });
  if (!res.ok) return;
}

export async function addOrgStaff(input: unknown): Promise<{ email: string }> {
  await requireSuperAdmin();
  const parsed = addOrgStaffSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const name = parsed.name ?? email;

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
    role: parsed.role,
    status: 'pending',
  });
  if (assignError) throw new Error(assignError.message);

  const admin = createAdminClient();
  const [{ data: existingStaffUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);

  if (existingStaffUser || existingRider) {
    await sendStaffInviteNotification({
      to: email,
      name,
      role: parsed.role,
      showName: show.name,
    }).catch(() => undefined);
  } else {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        firstName: name.trim().split(/\s+/)[0] ?? name,
        role: parsed.role,
        showName: show.name,
      },

      redirectTo: env.siteUrl,
    });

    if (!inviteError) {
      await admin.from('users').insert({
        id: invited.user.id,
        name,
        email,
        platform_role: platformRoleForStaff(parsed.role),
      });
    }
  }

  revalidatePath(USERS_PATH);
  return { email };
}

export async function changeStaffRole(input: unknown): Promise<{ ok: true }> {
  const { staffId, role } = changeStaffRoleSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('staff_assignments').update({ role }).eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function updateStaffPermissions(input: unknown): Promise<{ ok: true }> {
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

export async function sendLeadOnboarding(input: unknown): Promise<{ emailSent: boolean }> {
  const { id } = leadIdSchema.parse(input);
  const supabase = await createServerClient();

  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('onboarding_checklist')
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

  const { error } = await supabase
    .from('leads')
    .update({
      onboarding_checklist: checklist,
      onboarding_email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`${SALES_PATH}/${id}`);
  return { emailSent: false };
}

export async function createScoringSheet(input: unknown): Promise<{ id: string }> {
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
  const { id } = sheetIdSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('scoring_catalog').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  return { ok: true };
}

export async function uploadCatalogDocument(input: unknown): Promise<{ id: string }> {
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
  const { id, folder } = moveDocumentSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('catalog_documents').update({ folder }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(DOCUMENTS_PATH);
  return { ok: true };
}

export async function updateSettlement(input: unknown): Promise<void> {
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
