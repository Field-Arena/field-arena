'use server';

import { revalidatePath } from 'next/cache';
import { run, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
import { addOrgMember } from '@/modules/organizations/data/mutations';
import { assignJudgeToClasses } from '@/modules/judging/data/mutations';
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

/**
 * Confirms the caller may manage staff on this show, and returns its org id.
 *
 * There is no shared `requireShowManager`/`hasStaffPermission` helper
 * anywhere in this codebase yet (checked — modules/shows/data/mutations.ts
 * and every other write module rely on RLS alone, or a local, unexported gate
 * like superadmin's `requireSuperAdmin`). This is that local gate for the
 * organizer Users page: an Organizer who owns the show's organization passes
 * outright, a SuperAdmin impersonating that organization passes the same way
 * getOrganizerContext treats it, and everyone else is checked against the
 * real `has_show_permission(..., 'canManageStaff')` Postgres function — the
 * same RPC getOrganizerContext already uses for canViewMoney. This function
 * exists specifically because the two calls below reach for the service-role
 * admin client (to provision a login), which bypasses RLS — so unlike an
 * ordinary show mutation, the policy alone can no longer be the gate.
 */
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

/** staff_assignments.role stores the human label ('Show Admin'); users.platform_role stores the compact form ('ShowAdmin'). Mirrors superadmin/data/mutations.ts's identical helper — both are one-liners, not worth a cross-module import for. */
function platformRoleForStaff(role: string): string {
  return role === 'Show Admin' ? 'ShowAdmin' : role;
}

/**
 * Notifies an email that already has an account about a new assignment.
 * `inviteUserByEmail` below only applies to a brand-new address — resending
 * it to an existing account would just re-send a signup confirmation, not
 * tell them about this show. Legacy's staff POST handler sends this same
 * "You're invited as {role} for {show}" email unconditionally, regardless of
 * whether the address already has an account (api/shows/[id]/[resource].js),
 * so this closes that gap rather than leaving the person to find out on
 * their own. Best-effort, matching provisionIfNewAccount below: the
 * staff_assignments row is the grant that matters, not this notification.
 */
async function sendStaffInviteNotification(params: {
  to: string;
  name: string;
  role: string;
  showName: string;
}): Promise<void> {
  // First name only for the greeting, and the raw URL shown as the link text
  // rather than a styled button — matches the wording/shape of legacy's own
  // staff invite email ("Hi {first}, You've been added as {role} for {show}.
  // Click below to confirm and get set up: {link}").
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

/**
 * Best-effort account provisioning: invites the address if it has no account
 * at all yet (staff or rider), same reasoning as `addOrgStaff` in
 * modules/superadmin/data/mutations.ts. An address that already has an
 * account is notified instead of re-invited (see sendStaffInviteNotification
 * above) — legacy sends its invite email either way, so this is the one path
 * that reaches every case. Never throws: the staff_assignments row is the
 * grant that matters, and an invite/notify failure (e.g. the address already
 * has an unlinked auth account) shouldn't roll back a real, successful
 * assignment.
 */
async function provisionIfNewAccount(
  email: string,
  name: string,
  role: string,
  showName: string
): Promise<void> {
  const admin = createAdminClient();
  const [{ data: existingStaffUser }, { data: existingRider }] = await Promise.all([
    admin.from('users').select('id').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);
  if (existingStaffUser || existingRider) {
    await sendStaffInviteNotification({ to: email, name, role, showName }).catch(() => undefined);
    return;
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    // firstName/role/showName feed the hosted invite email template's
    // {{ .Data.* }} placeholders (see supabase's mailer_templates_invite_content,
    // set via the Management API) — a staff invite renders "You've been added
    // as {role} for {show}"; an organizer/superadmin invite (which never
    // passes these) falls back to its existing generic copy.
    data: { name, firstName: name.trim().split(/\s+/)[0] ?? name, role, showName },
    // Only satisfies inviteUserByEmail's own allow-list check — does not
    // drive the emailed link's domain, which always comes from Supabase's
    // own project-level site_url template setting regardless of what's
    // passed here (see superadmin/data/mutations.ts's createOrganization for
    // the full explanation, including why {{ .RedirectTo }} isn't a fix).
    redirectTo: env.siteUrl,
  });
  if (inviteError) return;

  await admin.from('users').insert({
    id: invited.user.id,
    name,
    email,
    platform_role: platformRoleForStaff(role),
  });
}

/**
 * "+ Add User" — the organizer-scoped equivalent of superadmin's
 * `addOrgStaff`, callable by the organizer/show manager themselves rather
 * than gated behind SuperAdmin.
 *
 * Vendor branches away entirely: legacy's own modal posts a Vendor to
 * `/api/shows/:id/vendors`, never `/staff` (showstaff.html:9005-9020) — a
 * `vendor_bookings` row, no staff_assignments row, no invite email (vendors
 * self-serve their own account through the vendor portal's own booking
 * flow, not a staff invite). Every other role keeps the real shape: a
 * staff_assignments grant (through the caller's own client, so
 * staff_assignments_write / canManageStaff still applies as defense in
 * depth even though requireCanManageStaff already checked it), then
 * best-effort login provisioning for a brand-new email, then — Judge only —
 * seating them on whichever classes were checked (see assignJudgeToClasses).
 *
 * The staff_assignments id is generated here rather than read back with
 * `.select()`: `staff_assignments_select`'s RLS policy resolves through
 * `can_view_show` → `has_staff_assignment`, which queries staff_assignments
 * itself — the same self-referential `INSERT ... RETURNING` failure already
 * worked around in shows/data/mutations.ts's createShow. Knowing the id
 * upfront is also what lets the Judge branch below seat the new row without
 * a second round trip to look it up.
 */
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

    // Which tests/classes this judge is on the panel for, filled in now
    // instead of the organizer opening their panel afterward and adding
    // classes one at a time — see assignJudgeToClasses's own doc comment.
    if (parsed.role === 'Judge' && parsed.classIds.length > 0) {
      await assignJudgeToClasses({ staffId, classIds: parsed.classIds });
    }

    if (parsed.addToMemberDatabase) {
      // Best-effort, matching legacy's own try/catch around this call: the
      // staff assignment above already succeeded and is the grant that
      // matters, so a member-database failure must not surface as this whole
      // action having failed.
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

/** Changes one staff member's role. */
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

/**
 * Moves a staff_assignments row to a different show — same person, same
 * role/permissions, just a new show_id. Ported from legacy's PATCH
 * /api/staff/:id (api/staff/[id].js:37-54): when its optional `showId` field
 * differs from the row's current show, it re-runs `requireShowManager`
 * against the *destination* show too, not just the source one — otherwise a
 * manager of show A could move someone's assignment onto show B without
 * having any authority there. Both checks go through the same
 * `requireCanManageStaff` gate the rest of this file already uses.
 */
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

/**
 * Saves name/email/phone/isSteward for an existing staff_assignments row —
 * the rest of legacy's PATCH /api/staff/:id (api/staff/[id].js:24,56-65)
 * beyond role/permissions/showId, which already have their own actions above.
 *
 * `status` is deliberately not part of this: legacy's own edit-existing-user
 * modal sends it (showstaff.html's um-status select), but in this schema
 * `staff_assignments.status` is never read for display — the directory's
 * status pill is derived entirely from whether a `public.users` row for this
 * email has actually signed in (see queries.ts's listAllUsersAcrossShows, "──
 * Staff status" comment). Writing to that column would change nothing an
 * operator could see, so exposing an editable control for it here would be
 * decorative rather than a real capability.
 */
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

/**
 * Saves the per-person permission toggles. The whole resolved set is written
 * as the explicit `permissions` jsonb, so what the editor showed is exactly
 * what is stored — matching superadmin's `updateStaffPermissions` and, before
 * it, the legacy `submitStaffPerm`.
 */
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

/** Removes a staff assignment. Hard delete, matching legacy and superadmin's identical action. */
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

/**
 * "Upload Staff List" — bulk-adds parsed CSV rows to one show's roster.
 * Legacy explicitly flags this and "Invite" as demo-mode no-ops ("don't send
 * real email in this demo"); this app already has a working real-invite path
 * (the same one `addStaffUser` uses), so this is the real thing: every row
 * gets a genuine staff_assignments grant and best-effort provisioning, not a
 * local-only fixture push.
 *
 * Dedup is by email against the show's *current* roster, checked once up
 * front and updated in memory as rows are added — matching legacy's "adds to
 * the roster, it doesn't replace it" behaviour. Rows are inserted
 * sequentially (not in parallel) because each one's provisioning step must
 * not race the existence check the next row's provisioning depends on.
 */
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
