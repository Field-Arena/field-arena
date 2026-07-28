'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationFlagSchema,
} from '../schemas';

const CONSOLE_PATH = '/dashboard/superadmin';

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
