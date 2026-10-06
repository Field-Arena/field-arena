'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { safeInternalPath } from '@/shared/lib/safe-internal-path';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';
import {
  IMPERSONATION_COOKIE,
  PENDING_PREVIEW_COOKIE,
  PREVIEW_ROLE_COOKIE,
  PREVIEW_SHOW_COOKIE,
  RAIL_ROLE_COOKIE,
  VIEW_AS_COOKIE_MAX_AGE_SECONDS as MAX_AGE_SECONDS,
} from '@/shared/constants/view-as';

// SuperAdmin "view as" session writers: impersonating an organizer, switching
// the role rail, and previewing a real show. The matching server-only readers
// live in `@/shared/lib/auth/view-as`.

async function assertSuperAdmin(deniedMessage: string): Promise<void> {
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
    throw new Error(deniedMessage);
  }
}

export async function enterAsOrganizer(orgId: string): Promise<void> {
  await assertSuperAdmin('Only a platform administrator can enter as an organizer.');

  const supabase = await createServerClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, deleted_at')
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!org) throw new Error('That organization no longer exists.');
  // A deleted organizer's staff can't log in and riders can't buy into their
  // shows — entering their workspace would be acting as an account the rest of
  // the platform already treats as gone. Restore it first.
  if (org.deleted_at) {
    throw new Error('That organization is deleted — restore it before entering its workspace.');
  }

  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, org.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  const pending = store.get(PENDING_PREVIEW_COOKIE)?.value;
  if (pending === 'showadmin') {
    store.set(PREVIEW_ROLE_COOKIE, 'showadmin', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
  } else if (pending === 'organizer') {
    store.delete(PREVIEW_ROLE_COOKIE);
  }
  if (pending) store.delete(PENDING_PREVIEW_COOKIE);

  redirect('/dashboard');
}

export async function exitOrganizerView(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
  redirect('/dashboard/superadmin');
}

export async function setRailRole(role: string): Promise<void> {
  await assertSuperAdmin('Only SuperAdmin can switch the role rail.');

  const workspace = role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];
  if (!workspace) throw new Error('Unknown role.');

  const store = await cookies();
  store.set(RAIL_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

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

/* Which real show a SuperAdmin is previewing a per-show role against.
 *
 * Legacy's "Viewing as" menu was scoped per show — you picked "Judge · Spring
 * Classic", and it loaded that role's real app with ?org= and ?show= so the
 * screen showed that show's actual panel, classes and entries. Without a show
 * in hand the role workspaces have nothing real to read for a SuperAdmin (who
 * holds no staff_assignments rows of their own) and fall back to demo data —
 * plausible-looking numbers presented inside the same chrome as every real
 * view, which is exactly the trap legacy called out and fixed for its own
 * riders roster. This cookie is what makes the preview real. */
export async function setPreviewShow(showId: string, destination: string): Promise<void> {
  await assertSuperAdmin('Only a platform administrator can preview a show.');

  const supabase = await createServerClient();
  const { data: show, error } = await supabase
    .from('shows')
    .select('id')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!show) throw new Error('That show no longer exists.');

  const store = await cookies();
  store.set(PREVIEW_SHOW_COOKIE, show.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  redirect(safeInternalPath(destination, '/dashboard'));
}

export async function clearPreviewShow(destination = '/dashboard/superadmin'): Promise<void> {
  const store = await cookies();
  store.delete(PREVIEW_SHOW_COOKIE);
  redirect(safeInternalPath(destination, '/dashboard/superadmin'));
}
