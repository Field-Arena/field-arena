'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';

const SELECTED_ORG_COOKIE = 'fa_selected_org';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface MemberOrg {
  orgId: string;
  orgName: string;
}

async function listMemberOrgs(profile: {
  id: string;
  org_id: string | null;
}): Promise<MemberOrg[]> {
  const supabase = await createServerClient();
  const byId = new Map<string, string>();

  if (profile.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', profile.org_id)
      .maybeSingle();
    if (org) byId.set(org.id, org.name);
  }

  const { data: assignments, error } = await supabase
    .from('staff_assignments')
    .select('shows(org_id, organizations(name))')
    .eq('user_id', profile.id);
  if (error) throw error;

  for (const row of assignments) {
    const show = row.shows as { org_id: string; organizations: { name: string } | null } | null;
    if (show?.org_id && !byId.has(show.org_id)) {
      byId.set(show.org_id, show.organizations?.name ?? 'Organization');
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
    if (org && !byId.has(org.id)) byId.set(org.id, org.name);
  }

  return [...byId.entries()]
    .map(([orgId, orgName]) => ({ orgId, orgName }))
    .sort((a, b) => a.orgName.localeCompare(b.orgName));
}

export async function getSelectedOrg(profile: {
  id: string;
  org_id: string | null;
}): Promise<{ orgId: string | null; memberOrgs: MemberOrg[] }> {
  const memberOrgs = await listMemberOrgs(profile);
  if (memberOrgs.length === 0) return { orgId: null, memberOrgs };

  const store = await cookies();
  const cookieOrgId = store.get(SELECTED_ORG_COOKIE)?.value;
  if (cookieOrgId && memberOrgs.some((o) => o.orgId === cookieOrgId)) {
    return { orgId: cookieOrgId, memberOrgs };
  }

  const ownOrg = profile.org_id ? memberOrgs.find((o) => o.orgId === profile.org_id) : undefined;
  const defaultOrg = ownOrg ?? memberOrgs[0];

  if (!defaultOrg) return { orgId: null, memberOrgs };
  return { orgId: defaultOrg.orgId, memberOrgs };
}

export async function setSelectedOrg(orgId: string, returnTo?: string): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: profile } = await supabase
    .from('users')
    .select('id, org_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) throw new Error('Not signed in.');

  const memberOrgs = await listMemberOrgs(profile);
  if (!memberOrgs.some((o) => o.orgId === orgId)) {
    throw new Error('You do not have access to that organization.');
  }

  const store = await cookies();
  store.set(SELECTED_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  const target = safeReturnTo(returnTo);
  revalidatePath('/dashboard', 'layout');
  revalidatePath(target, 'page');
  redirect(target);
}

function safeReturnTo(value: string | undefined): string {
  if (!value) return '/dashboard';
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
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
