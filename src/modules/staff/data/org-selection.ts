'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';

/**
 * Which organization the "Organization" switcher currently points at, for a
 * staff member with real access to more than one.
 *
 * Nothing prevents the same email from being staffed on shows across
 * multiple organizations (see staff/data/mutations.ts's addStaffUser — no
 * uniqueness check, matching legacy), but `users.org_id` is write-once at
 * account creation and never updated again. Left unaddressed, a person's
 * dashboard silently and permanently resolves to whichever org they joined
 * first (or, if `org_id` was never set — the common case for pure staff
 * roles — whichever row an *unordered* query happens to return), with no way
 * to reach any other org they are genuinely staffed on. This cookie is a
 * standing choice among real, verified memberships — it never grants access
 * beyond what `listMemberOrgs` below already confirms this person holds.
 */
const SELECTED_ORG_COOKIE = 'fa_selected_org';

/** A standing choice, not a preview session — matches how long impersonation's own cookie lives. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface MemberOrg {
  orgId: string;
  orgName: string;
}

/**
 * Every organization this person has real, standing access to: their own org
 * (a real Organizer's `users.org_id`) plus every distinct org behind any
 * `staff_assignments` row for their account. Sorted by name so both the
 * switcher and the default pick below are deterministic — never whichever
 * row Postgres happens to return first.
 */
async function listMemberOrgs(profile: { id: string; org_id: string | null }): Promise<MemberOrg[]> {
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

  return [...byId.entries()]
    .map(([orgId, orgName]) => ({ orgId, orgName }))
    .sort((a, b) => a.orgName.localeCompare(b.orgName));
}

/**
 * Resolves the org the switcher currently points at: the cookie if it names
 * one of this person's real memberships, else their own org (a real
 * Organizer), else the alphabetically-first membership. Called independently
 * from both the dashboard layout (to render the switcher) and
 * `getOrganizerContext` (to scope the page itself) — the same pattern this
 * module already uses for `getPreviewingAsShowAdmin`, rather than threading
 * one result through props.
 */
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
  // Unreachable in practice — the length check above guarantees an entry —
  // but avoids a non-null assertion on an indexed array access.
  if (!defaultOrg) return { orgId: null, memberOrgs };
  return { orgId: defaultOrg.orgId, memberOrgs };
}

/** `returnTo` handling matches preview-role.ts's setPreviewRole — see that file for why redirect (not router.refresh()) is what makes this reliable. */
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

  // Re-verified server-side rather than trusting the caller's selection —
  // this cookie can only ever point at an org this account is genuinely
  // staffed on or owns, never an arbitrary id typed into the request.
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
