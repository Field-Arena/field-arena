'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';

/**
 * "Enter as organizer" — SuperAdmin impersonation.
 *
 * The legacy console had this as a first-class feature, and api/_lib/authz.js
 * documents SuperAdmin's reach as "a real support/impersonation capability, not
 * a bug", so it is deliberate rather than an accident of over-broad permissions.
 *
 * Two things make this safe to expose:
 *
 *  1. Only a SuperAdmin can set the cookie. The check happens server-side inside
 *     this action, not in the UI that renders the button — a Server Action is
 *     publicly callable, so anyone could POST to it.
 *
 *  2. It changes *scope*, never *authority*. The cookie only tells the organizer
 *     workspace which organization to display. Every query still runs under the
 *     caller's own session, so RLS decides what is readable — a SuperAdmin can
 *     already read any organization, and impersonating grants nothing extra.
 *     Nobody else can use the cookie at all: the workspace ignores it unless
 *     is_super_admin() is true.
 *
 * httpOnly so client script cannot read or forge it, and sameSite lax so it
 * survives an ordinary navigation but not a cross-site request.
 *
 * Lives in shared/lib rather than modules/superadmin/data because
 * getImpersonatedOrgId (and exitOrganizerView) are read by every module whose
 * mutations need to know which organization the caller is acting as — shows,
 * sales, organizations, staff, vendors — plus the dashboard layout itself, not
 * just the superadmin console that sets the cookie.
 */
const IMPERSONATION_COOKIE = 'fa_impersonate_org';

/** Eight hours — a support session, not a standing state to forget about. */
const MAX_AGE_SECONDS = 60 * 60 * 8;

async function assertSuperAdmin(): Promise<void> {
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
    throw new Error('Only a platform administrator can enter as an organizer.');
  }
}

export async function enterAsOrganizer(orgId: string): Promise<void> {
  await assertSuperAdmin();

  const supabase = await createServerClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!org) throw new Error('That organization no longer exists.');

  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, org.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  // Honour the variant the SuperAdmin picked in the ROLES rail before they had
  // an org (rail-role.ts's 'fa_pending_preview', legacy platform.html's
  // pendingRoleKey): "Show Admin" enters money-hidden, "Organizer" enters full.
  // The literal cookie names are shared by name because a 'use server' module
  // cannot export a plain constant to import from the other side.
  const pending = store.get('fa_pending_preview')?.value;
  if (pending === 'showadmin') {
    store.set('fa_preview_role', 'showadmin', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
  } else if (pending === 'organizer') {
    store.delete('fa_preview_role');
  }
  if (pending) store.delete('fa_pending_preview');

  redirect('/dashboard');
}

export async function exitOrganizerView(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
  redirect('/dashboard/superadmin');
}

/**
 * The organization currently being impersonated, or null.
 *
 * Returns null for anyone who is not a SuperAdmin regardless of what the cookie
 * says, so a stale or forged cookie is inert rather than a privilege grant.
 */
export async function getImpersonatedOrgId(): Promise<string | null> {
  const store = await cookies();
  const orgId = store.get(IMPERSONATION_COOKIE)?.value;
  if (!orgId) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.platform_role === 'SuperAdmin' ? orgId : null;
}
