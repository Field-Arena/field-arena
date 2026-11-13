'use server';

import { revalidatePath } from 'next/cache';
import { run, parseInput, UserFacingError, type ActionResult } from '@/shared/lib/action-result';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { getSelectedOrg } from '@/modules/staff/data/org-selection';
import { JUDGES_PATH } from '@/modules/judges/constants';
import { createJudgeSchema, deleteJudgeSchema, updateJudgeSchema } from '@/modules/judges/schemas';
import { normalizeUsefId } from '@/modules/judges/utils/judge-display';

/** The organization whose directory the caller is working in. */
async function requireOrgId(): Promise<string> {
  const profile = await getStaffProfile();
  if (!profile) throw new UserFacingError('Not signed in.');

  const impersonatedOrgId = await getImpersonatedOrgId();
  if (impersonatedOrgId) return impersonatedOrgId;

  const { orgId } = await getSelectedOrg(profile);
  if (!orgId) throw new UserFacingError('Your account is not attached to an organization.');
  return orgId;
}

/** USEF-ID columns for a value typed by an organizer ('' clears it). */
function organizerUsefIdColumns(usefId: string | null, now: string) {
  return usefId === null
    ? {
        usef_id: null,
        usef_id_source: null,
        usef_id_entered_by: null,
        usef_id_verified_at: null,
        usef_id_updated_at: now,
      }
    : {
        usef_id: usefId,
        usef_id_source: 'manual',
        usef_id_entered_by: 'organizer',
        usef_id_verified_at: null,
        usef_id_updated_at: now,
      };
}

export async function createJudge(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run('Could not add this judge', async () => {
    const parsed = parseInput(createJudgeSchema, input);
    const orgId = await requireOrgId();
    const now = new Date().toISOString();
    const usefId = normalizeUsefId(parsed.usefId);

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('judges')
      .insert({
        org_id: orgId,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        name: `${parsed.firstName} ${parsed.lastName}`.trim(),
        email: parsed.email,
        phone: parsed.phone || null,
        ...(usefId ? organizerUsefIdColumns(usefId, now) : {}),
      })
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath(JUDGES_PATH);
    return { id: data.id };
  });
}

export async function updateJudge(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not save this judge', async () => {
    const parsed = parseInput(updateJudgeSchema, input);
    const orgId = await requireOrgId();
    const now = new Date().toISOString();
    const usefId = normalizeUsefId(parsed.usefId);

    const supabase = await createServerClient();
    const { data: current, error: currentError } = await supabase
      .from('judges')
      .select('usef_id')
      .eq('id', parsed.id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new UserFacingError('Judge not found.');

    // Only treat the ID as changed when it really differs, so re-saving a
    // judge's phone number never re-stamps "typed by organizer" over a value
    // the judge entered themselves.
    const usefIdChanged = usefId !== current.usef_id;

    const { error } = await supabase
      .from('judges')
      .update({
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        name: `${parsed.firstName} ${parsed.lastName}`.trim(),
        email: parsed.email,
        phone: parsed.phone || null,
        updated_at: now,
        ...(usefIdChanged ? organizerUsefIdColumns(usefId, now) : {}),
      })
      .eq('id', parsed.id)
      .eq('org_id', orgId);
    if (error) throw error;

    if (usefIdChanged) {
      // Keep the copy on each show's staff row in step. The results export falls
      // back to it if this judge is ever unlinked, and the Users page still
      // reads it. The judge record was just verified to belong to this org.
      const admin = createAdminClient();
      const { error: mirrorError } = await admin
        .from('staff_assignments')
        .update(
          usefId === null
            ? { usef_id: null, usef_id_source: null, usef_id_verified_at: null }
            : { usef_id: usefId, usef_id_source: 'manual', usef_id_verified_at: null },
        )
        .eq('judge_id', parsed.id);
      if (mirrorError) throw mirrorError;
    }

    revalidatePath(JUDGES_PATH);
    revalidatePath('/dashboard/users');
    return { ok: true };
  });
}

export async function deleteJudge(input: unknown): Promise<ActionResult<{ ok: true }>> {
  return run('Could not delete this judge', async () => {
    const { id } = parseInput(deleteJudgeSchema, input);
    const orgId = await requireOrgId();

    const supabase = await createServerClient();
    const { count, error: countError } = await supabase
      .from('staff_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('judge_id', id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      throw new UserFacingError(
        'This judge is on a show. Remove them from that show first, then delete them here.',
      );
    }

    const { error } = await supabase.from('judges').delete().eq('id', id).eq('org_id', orgId);
    if (error) throw error;

    revalidatePath(JUDGES_PATH);
    return { ok: true };
  });
}
