'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';

const IMPERSONATION_COOKIE = 'fa_impersonate_org';

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
