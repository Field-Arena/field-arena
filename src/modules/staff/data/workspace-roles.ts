import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';

/**
 * The workspaces a single staff user is actually entitled to — their global
 * platform_role plus every distinct per-show staff role they hold in
 * staff_assignments. This is purely a UI/routing concern: authority for those
 * per-show roles already lives in staff_assignments and is enforced by RLS on
 * every query, so surfacing the extra rail tiles grants no access the user
 * didn't already have. It just restores the multi-role workspace switcher
 * (one person invited as Judge on one show and Announcer on another can reach
 * both workspaces), matching how the legacy app worked.
 */

const ASSIGNMENT_ROLE_TO_WORKSPACE: Record<string, string> = {
  'Show Admin': 'ShowAdmin',
  Judge: 'Judge',
  Scribe: 'Scribe',
  Announcer: 'Announcer',
  ShowStaff: 'ShowStaff',
};

export async function getUserWorkspaceRoles(profile: {
  id: string;
  platform_role: string | null;
}): Promise<string[]> {
  const roles = new Set<string>();

  if (profile.platform_role && ROLE_WORKSPACES[profile.platform_role]) {
    roles.add(profile.platform_role);
  }

  const supabase = await createServerClient();
  const { data: assignments, error } = await supabase
    .from('staff_assignments')
    .select('role')
    .eq('user_id', profile.id);
  if (error) throw error;

  for (const row of assignments) {
    const mapped = row.role ? ASSIGNMENT_ROLE_TO_WORKSPACE[row.role] : undefined;
    if (mapped && ROLE_WORKSPACES[mapped]) roles.add(mapped);
  }

  return [...roles];
}
