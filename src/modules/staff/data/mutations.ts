'use server';

import { revalidatePath } from 'next/cache';
import { run, parseInput, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getImpersonatedOrgId } from '@/shared/lib/auth/view-as';
import { addOrgMember } from '@/modules/organizations';
import { assignJudgeToClasses, assignScribeToClasses } from '@/modules/judging';
import { verifyHorseDocument } from '@/modules/shows';
import { env } from '@/shared/lib/env';
import { sendEmail } from '@/shared/lib/email';
import { platformRoleForStaff } from '@/shared/lib/staff-platform-role';
import { ROUTES } from '@/shared/constants/routes';
import {
  addStaffUserSchema,
  changeStaffRoleSchema,
  updateStaffPermissionsSchema,
  staffIdSchema,
  importStaffListSchema,
  reassignStaffShowSchema,
  updateStaffDetailsSchema,
  assignRingAnnouncerSchema,
  updateRiderContactInfoSchema,
} from '../schemas';
import { isOwnerOnlyPermission, resolveStaffPermissions } from '../utils';
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type PermissionKey,
} from '@/shared/constants/permissions';

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

/* Grant scope — mirrors the staff_assignments_grant_scope trigger
 * (20261002120000_audit_security_fixes.sql) so the user gets a clear message
 * instead of a raw DB error. The org's Organizer / co-owner and SuperAdmin
 * (can_access_org) are unrestricted. Anyone else who has canManageStaff (a
 * Show Admin, typically):
 *   - may not grant or change money permissions (canViewMoney / canRefund),
 *   - may only newly grant a permission they hold on the show themselves,
 *   - may not add themselves or touch their own row's role/permissions.
 * Role changes are owner-only here (stricter than the trigger). */
async function isOrgOwner(orgId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('can_access_org', { target_org_id: orgId });
  if (error) throw error;
  return data;
}

async function requireOrgOwner(orgId: string, message: string): Promise<void> {
  if (!(await isOrgOwner(orgId))) throw new UserFacingError(message);
}

async function holdsShowPermission(showId: string, key: PermissionKey): Promise<boolean> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: key,
  });
  if (error) throw error;
  return data;
}

async function requireHoldsShowPermission(showId: string, key: PermissionKey): Promise<void> {
  if (!(await holdsShowPermission(showId, key))) {
    throw new UserFacingError(
      `You can't grant "${PERMISSION_LABELS[key]}" because you don't hold it on this show.`,
    );
  }
}

/* Nobody edits the permissions or role on their own staff row — not even an
 * owner (who doesn't need one). Matched on user_id and on email, since a row
 * may not be linked to the account yet. */
async function requireNotOwnRow(staffId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (!profile) throw new UserFacingError('Not signed in.');

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('staff_assignments')
    .select('user_id, email')
    .eq('id', staffId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new UserFacingError('Staff member not found.');

  const ownEmail = profile.email.trim().toLowerCase();
  if (data.user_id === profile.id || data.email?.trim().toLowerCase() === ownEmail) {
    throw new UserFacingError("You can't change your own permissions or role.");
  }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendStaffInviteNotification(params: {
  to: string;
  name: string;
  role: string;
  showName: string;
}): Promise<boolean> {
  const firstName = params.name.trim().split(/\s+/)[0] ?? params.name;
  const link = `${env.siteUrl}${ROUTES.login}`;

  // name / role / showName are all user-supplied (a CSV cell, a show title),
  // so every one is escaped before it goes into the HTML body.
  return sendEmail({
    to: params.to,
    subject: `You've been added as ${params.role} for ${params.showName}`,
    html:
      `<p>Hi ${escapeHtml(firstName)},</p>` +
      `<p>You've been added as <b>${escapeHtml(params.role)}</b> for ` +
      `<b>${escapeHtml(params.showName)}</b>. Click below to log in and get set up:</p>` +
      `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`,
  });
}

async function linkPendingAssignments(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from('staff_assignments')
    .update({ user_id: userId })
    .eq('email', email)
    .is('user_id', null);
  if (error) throw error;
}

/* Never throws for a failed *delivery* (the staff row is real either way and
 * the caller has already written it), but a failed DB write is surfaced: a
 * users row that silently didn't land leaves an invited account with no
 * profile, and an unlinked assignment hides the role from the switcher. */
async function provisionIfNewAccount(
  email: string,
  name: string,
  role: string,
  showName: string,
): Promise<void> {
  const admin = createAdminClient();
  const [existingStaffUserRes, existingRiderRes] = await Promise.all([
    admin.from('users').select('id, onboarded_at').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);
  if (existingStaffUserRes.error) throw existingStaffUserRes.error;
  if (existingRiderRes.error) throw existingRiderRes.error;
  const existingStaffUser = existingStaffUserRes.data;
  const existingRider = existingRiderRes.data;

  if (existingStaffUser || existingRider) {
    if (existingStaffUser) {
      await linkPendingAssignments(admin, email, existingStaffUser.id);

      // A users row exists but they never finished setting a password (e.g.
      // the first invite link expired or was never opened) — a plain login
      // link is a dead end for them. Resend a real Supabase invite instead,
      // same as resendOrganizerInvite does for organization owners.
      if (!existingStaffUser.onboarded_at) {
        const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { name, firstName: name.trim().split(/\s+/)[0] ?? name, role, showName },
          redirectTo: env.siteUrl,
        });
        if (!inviteError) return;
        // Fall through to the login-link email if Supabase refuses to
        // re-issue an invite (e.g. rate-limited) — still better than nothing.
      }
    }
    const sent = await sendStaffInviteNotification({ to: email, name, role, showName });
    if (!sent) console.error(`[staff] invite notification to ${email} was not delivered`);
    return;
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, firstName: name.trim().split(/\s+/)[0] ?? name, role, showName },

    redirectTo: env.siteUrl,
  });
  if (inviteError) {
    console.error(`[staff] invite to ${email} failed: ${inviteError.message}`);
    return;
  }

  const { error: profileError } = await admin.from('users').insert({
    id: invited.user.id,
    name,
    email,
    platform_role: platformRoleForStaff(role),
  });
  if (profileError) throw profileError;

  await linkPendingAssignments(admin, email, invited.user.id);
}

export async function addStaffUser(input: unknown): Promise<ActionResult<{ email: string }>> {
  return run('Could not invite this person', async () => {
    const parsed = parseInput(addStaffUserSchema, input);
    const { orgId, showName } = await requireCanManageStaff(parsed.showId);

    // Riders register themselves; the dialog never sends this role here.
    if (parsed.role === 'Rider') {
      throw new UserFacingError('Riders sign up through the show page, not as staff.');
    }

    const email = parsed.email.trim().toLowerCase();
    const supabase = await createServerClient();

    if (parsed.role !== 'Vendor' && !(await isOrgOwner(orgId))) {
      const profile = await getStaffProfile();
      if (profile?.email.trim().toLowerCase() === email) {
        throw new UserFacingError("You can't add yourself to a show's staff.");
      }
      if (parsed.canViewMoney) {
        throw new UserFacingError(
          'Only the organization owner can give someone access to financial data.',
        );
      }
      if (parsed.canScratchSkipDq) await requireHoldsShowPermission(parsed.showId, 'canScratch');
      if (parsed.role === 'Show Admin') {
        const { data: isShowAdmin, error: roleError } = await supabase.rpc('has_staff_assignment', {
          target_show_id: parsed.showId,
          allowed_roles: ['Show Admin'],
        });
        if (roleError) throw roleError;
        if (!isShowAdmin) {
          throw new UserFacingError(
            'Only a Show Admin or the organization owner can add a Show Admin.',
          );
        }
      }
    }

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
    const { staffId, role } = parseInput(changeStaffRoleSchema, input);
    const { orgId } = await requireCanManageStaff(await showIdForStaff(staffId));
    await requireOrgOwner(orgId, 'Only the organization owner can change a staff role.');
    await requireNotOwnRow(staffId);

    const supabase = await createServerClient();
    const { error } = await supabase.from('staff_assignments').update({ role }).eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function reassignStaffShow(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not move this person to that show', async () => {
    const { staffId, showId } = parseInput(reassignStaffShowSchema, input);
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
    const parsed = parseInput(updateStaffDetailsSchema, input);
    const { orgId } = await requireCanManageStaff(await showIdForStaff(parsed.staffId));

    // Re-pointing someone else's assignment at your own address would hand
    // you their role and permissions.
    const profile = await getStaffProfile();
    if (
      profile?.email.trim().toLowerCase() === parsed.email.trim().toLowerCase() &&
      !(await isOrgOwner(orgId))
    ) {
      const ownRowCheck = await createServerClient();
      const { data: row, error: rowError } = await ownRowCheck
        .from('staff_assignments')
        .select('user_id, email')
        .eq('id', parsed.staffId)
        .single();
      if (rowError) throw rowError;
      const alreadyMine =
        row.user_id === profile.id ||
        row.email?.trim().toLowerCase() === profile.email.trim().toLowerCase();
      if (!alreadyMine) {
        throw new UserFacingError("You can't move another staff assignment onto your own account.");
      }
    }

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
        license: parsed.license || null,
      })
      .eq('id', parsed.staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

/* riders has no RLS policy letting staff write another rider's row (only
 * riders_update_self) — deliberately, since a rider's own contact info is
 * theirs to correct. An organizer correcting a typo from the Users
 * directory is a real, occasional need though, so this goes through the
 * admin client with its own explicit canManageStaff check in code, the same
 * shape as the numbering resolvers in the filing-cabinet work: RLS is
 * bypassed here, so the permission check has to happen here instead. Only
 * first/last name and phone -- not email, since riders.id IS the Supabase
 * Auth user id here, and changing this column alone would desync the
 * displayed email from the rider's actual sign-in credential. */
export async function updateRiderContactInfo(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run("Could not save this rider's details", async () => {
    const parsed = parseInput(updateRiderContactInfoSchema, input);
    await requireCanManageStaff(parsed.showId);

    // canManageStaff on *this* show only reaches riders entered in it — the
    // admin client below bypasses RLS, so the scope check has to be here.
    const admin = createAdminClient();
    const [classEntry, showEntry] = await Promise.all([
      admin
        .from('class_entries')
        .select('id, classes!inner(show_id)')
        .eq('rider_id', parsed.riderId)
        .eq('classes.show_id', parsed.showId)
        .limit(1),
      admin
        .from('show_entries')
        .select('id')
        .eq('rider_id', parsed.riderId)
        .eq('show_id', parsed.showId)
        .limit(1),
    ]);
    if (classEntry.error) throw classEntry.error;
    if (showEntry.error) throw showEntry.error;
    if (classEntry.data.length === 0 && showEntry.data.length === 0) {
      throw new UserFacingError('That rider is not entered in this show.');
    }

    const { error } = await admin
      .from('riders')
      .update({
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        phone: parsed.phone || null,
      })
      .eq('id', parsed.riderId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

/* Thin re-export so the rider detail dialog can save a Coggins/document
 * checkbox without reaching into shows/ directly from ui/ — mirrors the
 * judging re-exports above. horses' own RLS already allows a staffed
 * canApproveDocuments holder to write here (this is the same mutation the
 * Horses tab uses), so no admin-client bypass is needed. */
export async function verifyRiderHorseDocument(
  input: unknown,
): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save this document', async () => {
    await verifyHorseDocument(input);
    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function assignRingAnnouncer(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save that ring assignment', async () => {
    const { showId, ringName, staffAssignmentId } = parseInput(assignRingAnnouncerSchema, input);
    await requireCanManageStaff(showId);

    const supabase = await createServerClient();
    if (staffAssignmentId) {
      const { error } = await supabase.from('ring_assignments').upsert(
        {
          show_id: showId,
          ring_name: ringName,
          staff_assignment_id: staffAssignmentId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'show_id,ring_name' },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('ring_assignments')
        .delete()
        .eq('show_id', showId)
        .eq('ring_name', ringName);
      if (error) throw error;
    }

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function updateStaffPermissions(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save those permissions', async () => {
    const { staffId, permissions } = parseInput(updateStaffPermissionsSchema, input);
    const showId = await showIdForStaff(staffId);
    const { orgId } = await requireCanManageStaff(showId);
    await requireNotOwnRow(staffId);

    const supabase = await createServerClient();
    const implicitKeys = new Set<PermissionKey>();

    if (!(await isOrgOwner(orgId))) {
      // Compared against what's stored, resolved the way the dialog shows it
      // (which always sends the full key set), so re-saving an unchanged
      // toggle is never mistaken for a new grant.
      const { data: current, error: currentError } = await supabase
        .from('staff_assignments')
        .select('role, permissions, can_scratch_skip_dq, can_view_money')
        .eq('id', staffId)
        .single();
      if (currentError) throw currentError;
      const resolved = resolveStaffPermissions({
        role: current.role,
        permissions: current.permissions,
        canScratchSkipDq: current.can_scratch_skip_dq,
        canViewMoney: current.can_view_money,
      });
      const stored =
        current.permissions && typeof current.permissions === 'object'
          ? (current.permissions as Record<string, unknown>)
          : {};

      for (const key of PERMISSION_KEYS) {
        const next = permissions[key];
        if (isOwnerOnlyPermission(key) && next !== resolved[key]) {
          throw new UserFacingError(
            'Only the organization owner can change financial or refund permissions.',
          );
        }
        if (!next || stored[key] === true) continue;
        // Already on via the role default / legacy column: not a new grant.
        // Leave it implicit so the stored JSON doesn't gain a "new" true.
        if (resolved[key]) {
          implicitKeys.add(key);
          continue;
        }
        await requireHoldsShowPermission(showId, key);
      }
    }

    const { error } = await supabase
      .from('staff_assignments')
      .update({
        permissions: Object.fromEntries(
          Object.entries(permissions).filter(([key]) => !implicitKeys.has(key as PermissionKey)),
        ),
      })
      .eq('id', staffId);
    if (error) throw error;

    revalidatePath(USERS_PATH);
    return { ok: true };
  });
}

export async function removeStaffAssignment(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not remove this person', async () => {
    const { staffId } = parseInput(staffIdSchema, input);
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
    const { showId, rows } = parseInput(importStaffListSchema, input);
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
      try {
        await provisionIfNewAccount(email, name, row.role, showName);
      } catch (error) {
        // The assignment row is in; one bad invite mustn't abort the rest.
        console.error(`[staff] could not provision ${email}`, error);
      }
    }

    revalidatePath(USERS_PATH);
    return { added, skipped, failed };
  });
}
