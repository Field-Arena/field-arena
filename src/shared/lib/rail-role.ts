'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';

/**
 * Which role SuperAdmin is currently previewing via the console's ROLES
 * rail — independent of `modules/staff/data/preview-role.ts`'s cookie,
 * which exists for a different reason (an Organizer's own money-hiding
 * self-preview) and only ever covers two of these nine roles.
 *
 * Needed because two pairs of roles share one workspace href — Organizer
 * and Show Admin both land on `/dashboard`, Judge and Scribe both land on
 * `/dashboard/judging` — so the current URL alone can't say which rail icon
 * should be highlighted. This records the click itself.
 */
const RAIL_ROLE_COOKIE = 'fa_rail_role';

/**
 * Remembers whether the SuperAdmin wanted the Organizer or the Show Admin view
 * when they clicked one of those rail icons with no organization picked yet —
 * so the org picker they're sent to can land them straight in that variant once
 * they "Enter as organizer" (legacy platform.html's `pendingRoleKey`). Read and
 * cleared by enterAsOrganizer (which reads it by the same literal name, since a
 * 'use server' module cannot export a plain constant to share).
 */
const PENDING_PREVIEW_COOKIE = 'fa_pending_preview';

/** A preview session, not a standing state — matches preview-role.ts's own framing. */
const MAX_AGE_SECONDS = 60 * 60 * 8;

async function requireSuperAdmin(): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: profile } = await supabase
    .from('users')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.platform_role !== 'SuperAdmin') {
    throw new Error('Only SuperAdmin can switch the role rail.');
  }
}

/** Sets which rail icon is active and navigates to that role's workspace, in one round trip. */
export async function setRailRole(role: string): Promise<void> {
  await requireSuperAdmin();

  const workspace = role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];
  if (!workspace) throw new Error('Unknown role.');

  const store = await cookies();
  store.set(RAIL_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  // The Organizer / Show Admin workspaces need a real organization — there is
  // nothing to render for a SuperAdmin who hasn't picked one, so (matching the
  // legacy platform.html rail) send them to the org picker instead of a blank
  // /dashboard, remembering which variant they wanted so "Enter as organizer"
  // drops them straight into it. Every other role previews with its own sample
  // data and needs no org, so those go straight to their workspace.
  if (role === 'Organizer' || role === 'ShowAdmin') {
    store.set(PENDING_PREVIEW_COOKIE, role === 'ShowAdmin' ? 'showadmin' : 'organizer', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
    redirect('/dashboard/superadmin');
  }

  redirect(workspace.href);
}

/** The role to highlight in the rail — null when nothing has been picked yet. */
export async function getRailRole(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(RAIL_ROLE_COOKIE)?.value;
  if (!value) return null;
  if (value !== 'Rider' && !ROLE_WORKSPACES[value]) return null;
  return value;
}
