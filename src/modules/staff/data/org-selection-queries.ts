import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getOrgAccessBlock } from '@/modules/staff/data/org-access-queries';
import { ASSIGNMENT_ROLE_TO_WORKSPACE, SELECTED_ORG_COOKIE } from '@/modules/staff/constants';
import type { MemberOrg } from '@/modules/staff/types';

/* Read side of the workspace org switcher. Lives in a 'server-only' module
 * rather than next to setSelectedOrg in the 'use server' file: every export
 * of a 'use server' file is a publicly callable endpoint, and these used to
 * take a caller-supplied profile — so anyone could list another user's orgs
 * by passing their id. Here the user is always derived from the session. */

export async function listMemberOrgs(profile: {
  id: string;
  org_id: string | null;
}): Promise<MemberOrg[]> {
  const supabase = await createServerClient();
  const byId = new Map<string, { name: string; roles: Set<string> }>();

  function tag(orgId: string, name: string, role: string) {
    const existing = byId.get(orgId);
    if (existing) {
      existing.roles.add(role);
      return;
    }
    byId.set(orgId, { name, roles: new Set([role]) });
  }

  if (profile.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', profile.org_id)
      .maybeSingle();
    if (org) tag(org.id, org.name, 'Organizer');
  }

  const { data: assignments, error } = await supabase
    .from('staff_assignments')
    .select('role, shows(org_id, organizations(name))')
    .eq('user_id', profile.id);
  if (error) throw error;

  for (const row of assignments) {
    const show = row.shows as { org_id: string; organizations: { name: string } | null } | null;
    const workspaceRole = row.role ? ASSIGNMENT_ROLE_TO_WORKSPACE[row.role] : undefined;
    if (show?.org_id && workspaceRole) {
      tag(show.org_id, show.organizations?.name ?? 'Organization', workspaceRole);
    }
  }

  // A second (or third...) organization this same person owns outright —
  // SuperAdmin-granted, see addOrganizationOwner in superadmin/data/mutations.ts.
  // Distinct from the staff_assignments source above: that's "invited to help
  // on one show," this is "owns the whole organization," same as their
  // primary org_id.
  const { data: owned, error: ownedError } = await supabase
    .from('organization_owners')
    .select('organizations(id, name)')
    .eq('user_id', profile.id);
  if (ownedError) throw ownedError;

  for (const row of owned) {
    const org = row.organizations as { id: string; name: string } | null;
    if (org) tag(org.id, org.name, 'Organizer');
  }

  return [...byId.entries()]
    .map(([orgId, { name, roles }]) => ({ orgId, orgName: name, roles: [...roles] }))
    .sort((a, b) => a.orgName.localeCompare(b.orgName));
}

// getSelectedOrg/getOrganizerContext back the Organizer and Show Admin
// workspace only (they share one shell at /dashboard) — a person also
// staffed as Judge or Announcer elsewhere shouldn't have that org picked
// here just because it's on their combined org list, or the shows/members
// this scopes to would silently be for a workspace they hold no role in.
const ORG_WORKSPACE_ROLES = ['Organizer', 'ShowAdmin'];

export async function getSelectedOrg(): Promise<{
  orgId: string | null;
  memberOrgs: MemberOrg[];
}> {
  const profile = await getStaffProfile();
  if (!profile) return { orgId: null, memberOrgs: [] };

  // A suspended or deleted org drops out of the switcher and can never be the
  // selected org, so no workspace read or write lands on it.
  const [allMemberOrgs, block] = await Promise.all([
    listMemberOrgs(profile),
    // A failed block lookup (e.g. no service key in a preview env) must not
    // take down every page; RLS still refuses a suspended org's data.
    getOrgAccessBlock().catch((error: unknown) => {
      console.error('getOrgAccessBlock failed', error);
      return { blockedOrgIds: [] as string[], allBlocked: null };
    }),
  ]);
  const memberOrgs = allMemberOrgs.filter((o) => !block.blockedOrgIds.includes(o.orgId));
  const eligible = memberOrgs.filter((o) => o.roles.some((r) => ORG_WORKSPACE_ROLES.includes(r)));
  if (eligible.length === 0) return { orgId: null, memberOrgs };

  const store = await cookies();
  const cookieOrgId = store.get(SELECTED_ORG_COOKIE)?.value;
  if (cookieOrgId && eligible.some((o) => o.orgId === cookieOrgId)) {
    return { orgId: cookieOrgId, memberOrgs };
  }

  const ownOrg = profile.org_id ? eligible.find((o) => o.orgId === profile.org_id) : undefined;
  const defaultOrg = ownOrg ?? eligible[0];

  if (!defaultOrg) return { orgId: null, memberOrgs };
  return { orgId: defaultOrg.orgId, memberOrgs };
}

/** Display name for one organization — used by the impersonation banner. */
export async function getOrganizationName(orgId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle();
  return data?.name ?? null;
}
