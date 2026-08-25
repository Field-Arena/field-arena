'use server';

import { revalidatePath } from 'next/cache';
import { run, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { addOrgMember } from '@/modules/organizations/data/mutations';
import { assignJudgeToClasses, assignScribeToClasses } from '@/modules/judging/data/mutations';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import {
  addStaffUserSchema,
  changeStaffRoleSchema,
  updateStaffPermissionsSchema,
  staffIdSchema,
  importStaffListSchema,
  reassignStaffShowSchema,
  updateStaffDetailsSchema,
} from '../schemas';

const USERS_PATH = '/dashboard/users';

async function requireCanManageStaff(showId: string): Promise<{ orgId: string; showName: string }> {
  const profile = await getStaffProfile();
  if (!profile) throw new UserFacingError('Not signed in.');

  const supabase = await createServerClient();
  const { data: show, error } = await supabase
    .from('shows')
    .select('org_id, name')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!show) throw new UserFacingError('Show not found.');

  const result = { orgId: show.org_id, showName: show.name };

  if (profile.platform_role === 'Organizer' && profile.org_id === show.org_id) return result;

  const impersonatedOrgId = await getImpersonatedOrgId();
  if (impersonatedOrgId && impersonatedOrgId === show.org_id) return result;

  const { data: allowed, error: rpcError } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canManageStaff',
  });
  if (rpcError) throw rpcError;
  if (!allowed)
    throw new UserFacingError('You do not have permission to manage staff for this show.');

  return result;
}

async function showIdForStaff(staffId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('staff_assignments')
    .select('show_id')
    .eq('id', staffId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new UserFacingError('Staff member not found.');
  return data.show_id;
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

async function provisionIfNewAccount(
  email: string,
  name: string,
  role: string,
  showName: string,
): Promise<void> {
  const admin = createAdminClient();
  const [{ data: existingStaffUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);
  if (existingStaffUser || existingRider) {
    if (existingStaffUser) {
      await admin
        .from('staff_assignments')
        .update({ user_id: existingStaffUser.id })
        .eq('email', email)
        .is('user_id', null);
    }
    await sendStaffInviteNotification({ to: email, name, role, showName }).catch(() => undefined);
    return;
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, firstName: name.trim().split(/\s+/)[0] ?? name, role, showName },

    redirectTo: env.siteUrl,
  });
  if (inviteError) return;

  await admin.from('users').insert({
    id: invited.user.id,
    name,
    email,
    platform_role: platformRoleForStaff(role),
  });

  await admin
    .from('staff_assignments')
    .update({ user_id: invited.user.id })
    .eq('email', email)
    .is('user_id', null);
}

export async function addStaffUser(input: unknown): Promise<ActionResult<{ email: string }>> {
  return run('Could not invite this person', async () => {
    const parsed = addStaffUserSchema.parse(input);
    const { orgId, showName } = await requireCanManageStaff(parsed.showId);

    const email = parsed.email.trim().toLowerCase();
    const supabase = await createServerClient();

    if (parsed.role === 'Vendor') {
      const businessName = parsed.businessName.trim();
      const { error: vendorError } = await supabase.from('vendor_bookings').insert({
        show_id: parsed.showId,
        name: businessName,
        contact: email,
      });
      if (vendorError) throw vendorError;

      if (parsed.addToMemberDatabase) {
        await addOrgMember({
          orgId,
          firstName: businessName,
          lastName: '',
          email,
          role: parsed.role,
          membershipStatus: parsed.membershipStatus,
          membershipExpires: parsed.membershipExpires,
        }).catch(() => undefined);
      }

      revalidatePath(USERS_PATH);
      return { email };
    }

    const firstName = parsed.firstName.trim();
    const lastName = parsed.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();
    const staffId = crypto.randomUUID();

    const { error: assignError } = await supabase.from('staff_assignments').insert({
      id: staffId,
      show_id: parsed.showId,
      email,
      name,
      first_name: firstName,
      last_name: lastName,
      role: parsed.role,
      status: 'pending',
      is_steward: parsed.role === 'Announcer' ? parsed.isSteward : false,
      can_scratch_skip_dq: parsed.canScratchSkipDq,
      can_view_money: parsed.canViewMoney,
    });
    if (assignError) throw assignError;

    await provisionIfNewAccount(email, name, parsed.role, showName);

    if (parsed.classIds.length > 0) {
      if (parsed.role === 'Judge') {
        await assignJudgeToClasses({ staffId, classIds: parsed.classIds });
      } else if (parsed.role === 'Scribe') {
        await assignScribeToClasses({ staffId, classIds: parsed.classIds });
      }
    }

    if (parsed.addToMemberDatabase) {
      await addOrgMember({
        orgId,
        firstName,
        lastName,
        email,
        role: parsed.role,
        membershipStatus: parsed.membershipStatus,
        membershipExpires: parsed.membershipExpires,
      }).catch(() => undefined);
    }

    revalidatePath(USERS_PATH);
    return { email };
  });
}

export async function changeStaffRole(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not change that role', async () => {
    const { staffId, role } = changeStaffRoleSchema.parse(input);
    await requireCanManageStaff(await showIdForStaff(staffId));

    const supabase = await createServerClient();
    const { error } = await supabase.from('staff_assignments').update({ role }).eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function reassignStaffShow(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not move this person to that show', async () => {
    const { staffId, showId } = reassignStaffShowSchema.parse(input);
    await requireCanManageStaff(await showIdForStaff(staffId));
    await requireCanManageStaff(showId);

    const supabase = await createServerClient();
    const { error } = await supabase
      .from('staff_assignments')
      .update({ show_id: showId })
      .eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function updateStaffDetails(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save these details', async () => {
    const parsed = updateStaffDetailsSchema.parse(input);
    await requireCanManageStaff(await showIdForStaff(parsed.staffId));

    const firstName = parsed.firstName.trim();
    const lastName = parsed.lastName.trim();
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('staff_assignments')
      .update({
        name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        email: parsed.email.trim().toLowerCase(),
        phone: parsed.phone || null,
        is_steward: parsed.isSteward,
      })
      .eq('id', parsed.staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function updateStaffPermissions(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save those permissions', async () => {
    const { staffId, permissions } = updateStaffPermissionsSchema.parse(input);
    await requireCanManageStaff(await showIdForStaff(staffId));

    const supabase = await createServerClient();
    const { error } = await supabase
      .from('staff_assignments')
      .update({ permissions })
      .eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function removeStaffAssignment(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not remove this person', async () => {
    const { staffId } = staffIdSchema.parse(input);
    await requireCanManageStaff(await showIdForStaff(staffId));

    const supabase = await createServerClient();
    const { error } = await supabase.from('staff_assignments').delete().eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function importStaffList(
  input: unknown,
): Promise<ActionResult<{ added: number; skipped: number; failed: number }>> {
  return run('Could not import that staff list', async () => {
    const { showId, rows } = importStaffListSchema.parse(input);
    const { showName } = await requireCanManageStaff(showId);

    const supabase = await createServerClient();
    const { data: existing, error: existingError } = await supabase
      .from('staff_assignments')
      .select('email')
      .eq('show_id', showId);
    if (existingError) throw existingError;

    const existingEmails = new Set(
      existing.map((r) => r.email?.trim().toLowerCase()).filter((e): e is string => !!e),
    );

    let added = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      if (existingEmails.has(email)) {
        skipped += 1;
        continue;
      }

      const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || email;
      const { error: assignError } = await supabase.from('staff_assignments').insert({
        show_id: showId,
        email,
        name,
        role: row.role,
        phone: row.phone || null,
        status: 'pending',
      });
      if (assignError) {
        failed += 1;
        continue;
      }

      existingEmails.add(email);
      added += 1;
      await provisionIfNewAccount(email, name, row.role, showName);
    }

    revalidatePath(USERS_PATH);
    return { added, skipped, failed };
  });
}
