'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';

const PREVIEW_SHOW_COOKIE = 'fa_preview_show';

const MAX_AGE_SECONDS = 60 * 60 * 8;

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
    throw new Error('Only a platform administrator can preview a show.');
  }
}

export async function setPreviewShow(showId: string, destination: string): Promise<void> {
  await assertSuperAdmin();

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

  redirect(destination);
}

export async function clearPreviewShow(destination = '/dashboard/superadmin'): Promise<void> {
  const store = await cookies();
  store.delete(PREVIEW_SHOW_COOKIE);
  redirect(destination);
}

/** The previewed show id, but only for a caller who is really a SuperAdmin. */
export async function getPreviewShowId(): Promise<string | null> {
  const store = await cookies();
  const showId = store.get(PREVIEW_SHOW_COOKIE)?.value;
  if (!showId) return null;

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

  return profile?.platform_role === 'SuperAdmin' ? showId : null;
}
