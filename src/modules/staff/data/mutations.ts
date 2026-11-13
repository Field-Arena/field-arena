'use server';

import { revalidatePath } from 'next/cache';
import { run, parseInput, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { addOrgMember } from '@/modules/organizations/data/mutations';
import { assignJudgeToClasses, assignScribeToClasses } from '@/modules/judging/data/mutations';
import { verifyHorseDocument } from '@/modules/shows/data/horses-mutations';
import { env } from '@/shared/lib/env';
import { ROUTES } from '@/shared/constants/routes';
import {
  addStaffUserSchema,
  addJudgesToShowSchema,
  changeStaffRoleSchema,
  updateStaffPermissionsSchema,
  staffIdSchema,
  importStaffListSchema,
  reassignStaffShowSchema,
  updateStaffDetailsSchema,
  assignRingAnnouncerSchema,
  updateRiderContactInfoSchema,
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
    admin.from('users').select('id, onboarded_at').eq('email', email).maybeSingle(),
    admin.from('riders').select('id').eq('email', email).maybeSingle(),
  ]);
  if (existingStaffUser || existingRider) {
    if (existingStaffUser) {
      await admin
        .from('staff_assignments')
        .update({ user_id: existingStaffUser.id })
        .eq('email', email)
        .is('user_id', null);

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

/** A judge record as the staff flows need it. */
interface DirectoryJudge {
  id: string;
  usef_id: string | null;
  usef_id_source: string | null;
  usef_id_verified_at: string | null;
}

const DIRECTORY_JUDGE_COLUMNS = 'id, usef_id, usef_id_source, usef_id_verified_at';

/**
 * Finds this organization's judge record for an email, creating it if it is new,
 * so a judge typed into a show's staff form is also saved to the Judges list.
 * Uses the admin client because a Show Admin who may manage this show's staff is
 * not an organization owner (the judges table is owner-only under RLS); the
 * caller has already passed requireCanManageStaff for a show in this org.
 */
async function upsertDirectoryJudge(
  orgId: string,
  person: { email: string; firstName: string; lastName: string; name: string; phone?: string },
): Promise<DirectoryJudge> {
  const admin = createAdminClient();

  const find = async () => {
    const { data, error } = await admin
      .from('judges')
      .select(DIRECTORY_JUDGE_COLUMNS)
      .eq('org_id', orgId)
      .eq('email', person.email)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const existing = await find();
  if (existing) return existing;

  const { data, error } = await admin
    .from('judges')
    .insert({
      org_id: orgId,
      first_name: person.firstName,
      last_name: person.lastName,
      name: person.name,
      email: person.email,
      phone: person.phone ?? null,
    })
    .select(DIRECTORY_JUDGE_COLUMNS)
    .single();
  if (!error) return data;

  // Two people adding the same judge at once: the unique index rejected ours.
  if ((error as { code?: string }).code === '23505') {
    const raced = await find();
    if (raced) return raced;
  }
  throw error;
}

export async function addStaffUser(input: unknown): Promise<ActionResult<{ email: string }>> {
  return run('Could not invite this person', async () => {
    const parsed = parseInput(addStaffUserSchema, input);
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

    // A judge typed in here also joins the organization's Judges list (or is
    // matched to the one already there), carrying their USEF ID with them.
    const directoryJudge =
      parsed.role === 'Judge'
        ? await upsertDirectoryJudge(orgId, { email, firstName, lastName, name })
        : null;

    const { error: assignError } = await supabase.from('staff_assignments').insert({
      id: staffId,
      show_id: parsed.showId,
      email,
      name,
      first_name: firstName,
      last_name: lastName,
      role: parsed.role,
      ...(directoryJudge
        ? {
            judge_id: directoryJudge.id,
            usef_id: directoryJudge.usef_id,
            usef_id_source: directoryJudge.usef_id_source,
            usef_id_verified_at: directoryJudge.usef_id_verified_at,
          }
        : {}),
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

export async function addJudgesToShow(
  input: unknown,
): Promise<ActionResult<{ added: number; skipped: number }>> {
  return run('Could not add these judges', async () => {
    const { showId, judgeIds } = parseInput(addJudgesToShowSchema, input);
    const { orgId, showName } = await requireCanManageStaff(showId);

    // Judges come from this show's own organization only, whoever is asking.
    const admin = createAdminClient();
    const { data: judges, error: judgesError } = await admin
      .from('judges')
      .select(
        'id, name, first_name, last_name, email, phone, usef_id, usef_id_source, usef_id_verified_at',
      )
      .eq('org_id', orgId)
      .in('id', judgeIds);
    if (judgesError) throw judgesError;
    if (judges.length === 0) throw new UserFacingError('Those judges are not in your list.');

    const supabase = await createServerClient();
    const { data: existing, error: existingError } = await supabase
      .from('staff_assignments')
      .select('judge_id, email')
      .eq('show_id', showId);
    if (existingError) throw existingError;

    const onShowJudgeIds = new Set(existing.map((r) => r.judge_id).filter((id) => !!id));
    const onShowEmails = new Set(
      existing.map((r) => r.email?.trim().toLowerCase()).filter((e): e is string => !!e),
    );

    let added = 0;
    let skipped = 0;
    for (const judge of judges) {
      const email = judge.email?.trim().toLowerCase() ?? null;
      if (onShowJudgeIds.has(judge.id) || (email && onShowEmails.has(email))) {
        skipped += 1;
        continue;
      }

      const { error: assignError } = await supabase.from('staff_assignments').insert({
        id: crypto.randomUUID(),
        show_id: showId,
        email,
        name: judge.name,
        first_name: judge.first_name,
        last_name: judge.last_name,
        phone: judge.phone,
        role: 'Judge',
        status: 'pending',
        judge_id: judge.id,
        usef_id: judge.usef_id,
        usef_id_source: judge.usef_id_source,
        usef_id_verified_at: judge.usef_id_verified_at,
      });
      if (assignError) {
        // Already on this show under the same email (unique per show): not an error.
        if ((assignError as { code?: string }).code === '23505') {
          skipped += 1;
          continue;
        }
        throw assignError;
      }

      added += 1;
      // Same invite the single-add form sends: a real invite for a new account,
      // a login link for someone who already has one.
      if (email) await provisionIfNewAccount(email, judge.name, 'Judge', showName);
    }

    revalidatePath(USERS_PATH);
    revalidatePath('/dashboard/judges');
    return { added, skipped };
  });
}

export async function changeStaffRole(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not change that role', async () => {
    const { staffId, role } = parseInput(changeStaffRoleSchema, input);
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
        // Only touched when the caller sends it. A hand-typed ID is 'manual'
        // and unverified; the USEF integration will set 'usef' itself.
        ...(parsed.usefId === undefined
          ? {}
          : parsed.usefId === ''
            ? { usef_id: null, usef_id_source: null, usef_id_verified_at: null }
            : { usef_id: parsed.usefId, usef_id_source: 'manual', usef_id_verified_at: null }),
      })
      .eq('id', parsed.staffId);
    if (error) throw error;

    // A judge linked to the organization's Judges list keeps their USEF ID on that
    // record, so an edit made here must reach it too (and the judge's other shows).
    if (parsed.usefId !== undefined) {
      const { data: row, error: rowError } = await supabase
        .from('staff_assignments')
        .select('judge_id')
        .eq('id', parsed.staffId)
        .maybeSingle();
      if (rowError) throw rowError;
      if (row?.judge_id) {
        const now = new Date().toISOString();
        const usefId = parsed.usefId === '' ? null : parsed.usefId;
        const admin = createAdminClient();
        const { error: judgeError } = await admin
          .from('judges')
          .update({
            usef_id: usefId,
            usef_id_source: usefId === null ? null : 'manual',
            usef_id_entered_by: usefId === null ? null : 'organizer',
            usef_id_verified_at: null,
            usef_id_updated_at: now,
            updated_at: now,
          })
          .eq('id', row.judge_id);
        if (judgeError) throw judgeError;

        const { error: siblingsError } = await admin
          .from('staff_assignments')
          .update({
            usef_id: usefId,
            usef_id_source: usefId === null ? null : 'manual',
            usef_id_verified_at: null,
          })
          .eq('judge_id', row.judge_id);
        if (siblingsError) throw siblingsError;
      }
    }

    revalidatePath(USERS_PATH);
    revalidatePath('/dashboard/judges');
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

    const admin = createAdminClient();
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
      await provisionIfNewAccount(email, name, row.role, showName);
    }

    revalidatePath(USERS_PATH);
    return { added, skipped, failed };
  });
}
