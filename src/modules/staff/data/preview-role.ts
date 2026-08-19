'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';

const PREVIEW_ROLE_COOKIE = 'fa_preview_role';

const MAX_AGE_SECONDS = 60 * 60 * 8;

async function canPreview(): Promise<boolean> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.platform_role === 'Organizer' || profile?.platform_role === 'SuperAdmin';
}

export async function setPreviewRole(
  role: 'organizer' | 'showadmin',
  returnTo?: string,
): Promise<void> {
  if (!(await canPreview())) {
    throw new Error('Only an Organizer can preview the workspace as Show Admin.');
  }

  const store = await cookies();
  if (role === 'showadmin') {
    store.set(PREVIEW_ROLE_COOKIE, role, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
  } else {
    store.delete(PREVIEW_ROLE_COOKIE);
  }

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

export async function getPreviewingAsShowAdmin(): Promise<boolean> {
  const store = await cookies();
  if (store.get(PREVIEW_ROLE_COOKIE)?.value !== 'showadmin') return false;
  return canPreview();
}
