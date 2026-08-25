'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES, RIDER_WORKSPACE } from '@/shared/constants/role-workspaces';

const RAIL_ROLE_COOKIE = 'fa_rail_role';

const PENDING_PREVIEW_COOKIE = 'fa_pending_preview';

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

export async function getRailRole(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(RAIL_ROLE_COOKIE)?.value;
  if (!value) return null;
  if (value !== 'Rider' && !ROLE_WORKSPACES[value]) return null;
  return value;
}
