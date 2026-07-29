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
  addSuperAdminSchema,
  superAdminIdSchema,
  addOrgStaffSchema,
  changeStaffRoleSchema,
  updateStaffPermissionsSchema,
  staffIdSchema,
  createLeadSchema,
  updateLeadSchema,
  leadIdSchema,
  createSheetSchema,
  updateSheetSchema,
  sheetIdSchema,
  uploadDocumentSchema,
  documentIdSchema,
  moveDocumentSchema,
} from '../schemas';
import { ONBOARDING_CHECKLIST_TEMPLATE } from '../constants';

const CONSOLE_PATH = '/dashboard/superadmin';
const USERS_PATH = '/dashboard/superadmin/users';
const SALES_PATH = '/dashboard/superadmin/sales';
const CATALOG_PATH = '/dashboard/superadmin/catalog';
const DOCUMENTS_PATH = '/dashboard/superadmin/documents';
const DOCS_BUCKET = 'catalog-docs';

/**
 * Confirms the caller is a Super Admin, and returns their profile.
 *
 * The Super Admin actions below reach for the service-role admin client, which
 * bypasses RLS — so unlike the organization actions, the policy can no longer be
 * the gate. This is that gate, run first in every one of them. getStaffProfile
 * goes through the caller's own client, so it reads the caller's real role.
 */
async function requireSuperAdmin() {
  const profile = await getStaffProfile();
  if (profile?.platform_role !== 'SuperAdmin') {
    throw new Error('Only a Super Admin can manage Super Admins.');
  }
  return profile;
}

/**
 * SuperAdmin write actions, ported from api/organizations.js.
 *
 * All of these go through the caller's own client rather than the service-role
 * client, so RLS decides whether they are allowed. That is deliberate: these are
 * publicly callable Server Actions, and the only thing standing between an
 * ordinary signed-in user and creating an organization is the
 * organizations_super_admin_all policy. Reaching for the admin client here would
 * silently remove that check.
 */

/** Invites expire after seven days, matching the legacy invite flow. */
const INVITE_TTL_DAYS = 7;

export async function createOrganization(input: unknown) {
  const parsed = createOrganizationSchema.parse(input);
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
      // Real customers, unlike the seeded example organizations.
      is_demo: false,
    })
    .select('id, name')
    .single();

  if (error) throw new Error(error.message);

  /**
   * The owner invite is created in the same action. An organization whose owner
   * has never accepted cannot be administered by anyone except a SuperAdmin, so
   * creating one without an invite produces a half-made account — which is the
   * state the console's Pending badge and Resend invite button exist to handle.
   *
   * No token is stored. Supabase's own invite link carries the secret, so
   * persisting a second one here would be an extra credential to leak. This row
   * records what role is being granted and for which organization, which
   * Supabase's invite has no concept of.
   */
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const { error: inviteError } = await supabase.from('invites').insert({
    email: parsed.contactEmail,
    role: 'Organizer',
    org_id: org.id,
    name: [parsed.contactFirstName, parsed.contactLastName].filter(Boolean).join(' '),
    expires_at: expiresAt.toISOString(),
  });

  if (inviteError) {
    /**
     * The organization exists but has no invite. Reported rather than swallowed,
     * and deliberately not rolled back: deleting the organization would discard a
     * real row for a recoverable problem, and Resend invite fixes this in one
     * click. PostgREST has no transaction across two statements, so an actual
     * atomic version would need a database function.
     */
    throw new Error(
      `Organization "${org.name}" was created, but its owner invite could not be saved (${inviteError.message}). Use Resend invite to try again.`
    );
  }

  revalidatePath(CONSOLE_PATH);
  return { id: org.id, name: org.name };
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

/**
 * Suspend or reactivate. A suspended organization's shows become invisible to
 * riders — the same 404-style response an unpublished show gets — while every row
 * stays intact. Reversible, which is why it is a plain toggle with no
 * confirmation.
 */
export async function setOrganizationSuspended(input: unknown) {
  const { id, value } = organizationFlagSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('organizations').update({ suspended: value }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
}

/**
 * Soft delete. Nothing cascades: the organization row and every child row —
 * shows, orders, riders, history — stay completely intact. A non-null deleted_at
 * means "hidden from the active list, and its shows and purchases are treated as
 * gone", enforced the same 404-style way as suspension.
 *
 * There is no undelete in the UI, matching legacy, so the caller must confirm.
 */
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

/**
 * Extends every outstanding invite's expiry.
 *
 * Honest about its limits: it refreshes the invite rows so they are valid again,
 * but it cannot send anything. Delivery needs an email provider, and RESEND_API_KEY
 * is unset. Reporting how many were refreshed — rather than claiming mail was
 * sent — keeps the difference visible.
 */
export async function refreshPendingInvites(): Promise<{ refreshed: number; emailSent: boolean }> {
  const supabase = await createServerClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const { data, error } = await supabase
    .from('invites')
    .update({ expires_at: expiresAt.toISOString() })
    .is('accepted_at', null)
    .select('id');

  if (error) throw new Error(error.message);

  revalidatePath(CONSOLE_PATH);
  return { refreshed: data.length, emailSent: false };
}

/**
 * Invites another Super Admin and provisions them immediately.
 *
 * Legacy created only an invite row and minted the users row on acceptance. This
 * app has no accept-invite provisioning yet, and signInWithPassword blocks any
 * account with no users/riders row — so an invite alone would let the new Super
 * Admin sign in and then bounce straight back out. Instead this creates the auth
 * user (which emails a set-password link) AND the SuperAdmin users row in one
 * step, so they are a working Super Admin the moment they set their password.
 * Until they do, they read as "Invite pending" because they have never signed in.
 *
 * inviteUserByEmail and the users insert both need the service-role client:
 * creating an auth user is not an RLS-governed operation at all. requireSuperAdmin
 * above is what authorizes this, since the policy no longer can.
 */
export async function addSuperAdmin(input: unknown): Promise<{ email: string }> {
  await requireSuperAdmin();
  const { name, email } = addSuperAdminSchema.parse(input);
  const normalizedEmail = email.trim().toLowerCase();

  const admin = createAdminClient();

  // A pre-existing account with this address cannot be silently promoted: it may
  // be a rider (the single-identity trigger forbids a users row alongside a
  // riders row) or already staff. Report it rather than half-acting.
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: { name },
      redirectTo: `${env.siteUrl}${ROUTES.authCallback}?next=${encodeURIComponent(USERS_PATH)}`,
    }
  );
  if (inviteError) {
    // The most common cause is an auth account that already exists for this
    // address without a staff profile (e.g. a rider, or a stalled signup).
    throw new Error(
      /already.*regist|exist/i.test(inviteError.message)
        ? 'That email already has an account. It can only be added as a Super Admin from the database, not through this invite.'
        : inviteError.message
    );
  }

  const { error: insertError } = await admin.from('users').insert({
    id: invited.user.id,
    name,
    email: normalizedEmail,
    platform_role: 'SuperAdmin',
  });
  if (insertError) {
    // Leave no orphaned auth user behind if the profile insert fails.
    await admin.auth.admin.deleteUser(invited.user.id);
    throw new Error(insertError.message);
  }

  revalidatePath(USERS_PATH);
  return { email: normalizedEmail };
}

/**
 * Removes a Super Admin (or cancels a still-pending one) by deleting the account.
 *
 * Deleting the auth user cascades to the users row (users.id references
 * auth.users on delete cascade), so this removes them entirely — matching the
 * legacy "deletes their account entirely; they'll need a brand-new invite". Two
 * guards, both from the legacy handler: you cannot remove yourself, and you
 * cannot remove the last remaining Super Admin.
 */
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

/**
 * staff_assignments.role stores the human label ('Show Admin'); users.platform_role
 * stores the compact form ('ShowAdmin'). Every other grantable role is identical
 * in both. The legacy code carried the same split.
 */
function platformRoleForStaff(role: string): string {
  return role === 'Show Admin' ? 'ShowAdmin' : role;
}

/**
 * Adds a staff member to one of an organizer's shows.
 *
 * Two things happen: the per-show grant (a staff_assignments row, which is what
 * the directory shows and what RLS resolves permissions from) and, if this email
 * has no account yet, an invite + provisioned users row so they can actually sign
 * in — the same reason addSuperAdmin provisions eagerly. Someone already holding
 * an account keeps it; they just gain the new assignment.
 *
 * requireSuperAdmin gates it because the provisioning half uses the service-role
 * client. The assignment insert itself still goes through the caller's client, so
 * staff_assignments_write (canManageStaff on the show) is also enforced.
 */
export async function addOrgStaff(input: unknown): Promise<{ email: string }> {
  await requireSuperAdmin();
  const parsed = addOrgStaffSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();
  const name = parsed.name ?? email;

  const supabase = await createServerClient();
  const { error: assignError } = await supabase.from('staff_assignments').insert({
    show_id: parsed.showId,
    email,
    name,
    role: parsed.role,
    status: 'pending',
  });
  if (assignError) throw new Error(assignError.message);

  // Provision a login only if this person has no account at all yet.
  const admin = createAdminClient();
  const [{ data: existingStaffUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);

  if (!existingStaffUser && !existingRider) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: `${env.siteUrl}${ROUTES.authCallback}`,
    });
    // Best-effort: the assignment is the grant that matters. If the invite fails
    // (e.g. the address already has an auth account), the row still stands and
    // they can be provisioned separately — so this does not throw.
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

/** Changes one staff member's role (directory inline dropdown). */
export async function changeStaffRole(input: unknown): Promise<{ ok: true }> {
  const { staffId, role } = changeStaffRoleSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('staff_assignments')
    .update({ role })
    .eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

/**
 * Saves the per-person permission toggles.
 *
 * The whole resolved set is written as the explicit `permissions` jsonb, so what
 * the editor showed is exactly what is stored — matching the legacy submitStaffPerm.
 */
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

/** Removes a staff assignment. Hard delete, matching legacy. */
export async function removeStaffAssignment(input: unknown): Promise<{ ok: true }> {
  const { staffId } = staffIdSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('staff_assignments').delete().eq('id', staffId);
  if (error) throw new Error(error.message);

  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ── Sales funnel (leads) ─────────────────────────────────────────────────────
//
// Every lead action goes through the caller's own client, gated by the
// leads_super_admin_all policy — same pattern as the organization actions. No
// admin client, because nothing here touches auth or another user's account.

/** A cleared text field stores NULL rather than an empty string. */
function emptyToNull(value: string | null | undefined): string | null {
  if (value) return value;
  return null;
}

/** Adds a manually-sourced target. It always lands in the funnel as "new". */
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

/**
 * Updates any subset of a lead's fields — the detail page saves contact,
 * economics, notes, status, the onboarding date, and the checklist through here.
 * Only keys that are actually present are written, so one form's Save never
 * clobbers another's fields. Changing status has no side effects, matching legacy
 * (demo_at and onboarding_at are set explicitly, never inferred from a stage).
 */
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
  if (parsed.avgRevenuePerShow !== undefined) updates.avg_revenue_per_show = parsed.avgRevenuePerShow;
  if (parsed.onboardingAt !== undefined) {
    updates.onboarding_at = parsed.onboardingAt ? new Date(parsed.onboardingAt).toISOString() : null;
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

/**
 * Seeds the onboarding checklist (first time only) and records that the email
 * went out. The email itself is not actually delivered — like the organizer
 * invite, custom mail needs an email provider this project has not configured
 * yet — so this reports emailSent:false rather than pretending. The checklist and
 * the sent-at timestamp are real and are what the detail page reads.
 */
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

// ── Scoring catalog ──────────────────────────────────────────────────────────
//
// Same pattern as the other console writes: the caller's own client, gated by
// scoring_catalog_write (is_super_admin). A sheet is a reusable test template
// every organizer's show draws from.

/** Creates a catalog stub — the "Upload official sheet" flow. */
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
      // A brand-new sheet is a stub until its criteria are transcribed.
      source: null,
      def: {},
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  return { id: data.id };
}

/** Updates any subset of a sheet's fields, including its `def` structure. */
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
  if (parsed.governingBody !== undefined) updates.governing_body = emptyToNull(parsed.governingBody);
  if (parsed.source !== undefined) updates.source = emptyToNull(parsed.source);
  if (parsed.def !== undefined) {
    // The def is validated Zod data whose catchall widens to unknown; it is
    // structurally valid Json, so this cast is safe.
    updates.def = parsed.def as Database['public']['Tables']['scoring_catalog']['Update']['def'];
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from('scoring_catalog').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  revalidatePath(`${CATALOG_PATH}/${id}`);
  return { ok: true };
}

/** Removes a catalog sheet. */
export async function deleteScoringSheet(input: unknown): Promise<{ ok: true }> {
  const { id } = sheetIdSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('scoring_catalog').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(CATALOG_PATH);
  return { ok: true };
}

// ── Documents (catalog file store) ───────────────────────────────────────────
//
// Uploads land in the private catalog-docs bucket and a catalog_documents row.
// All through the caller's own client: the fa_catalog_docs_write storage policy
// and catalog_documents_write both gate on is_super_admin(), so a non-admin's
// upload is rejected by Postgres/Storage rather than by an app check.

/** Uploads a file to a folder in the catalog store. */
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
    // Don't leave an orphaned object if the row insert fails.
    await supabase.storage.from(DOCS_BUCKET).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(DOCUMENTS_PATH);
  return { id: data.id };
}

/** Deletes a document — both its row and the stored object. */
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
    // Best-effort: the row is already gone, so a stray object is not worth failing on.
    await supabase.storage.from(DOCS_BUCKET).remove([row.path]);
  }

  revalidatePath(DOCUMENTS_PATH);
  return { ok: true };
}

/**
 * Moves a document between folders (Tests ↔ Documents). Only the folder column
 * changes — the stored object keeps its key, which is just an opaque path.
 */
export async function moveCatalogDocument(input: unknown): Promise<{ ok: true }> {
  const { id, folder } = moveDocumentSchema.parse(input);
  const supabase = await createServerClient();
  const { error } = await supabase.from('catalog_documents').update({ folder }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(DOCUMENTS_PATH);
  return { ok: true };
}
