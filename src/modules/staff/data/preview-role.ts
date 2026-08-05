'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';

/**
 * "Viewing as Organizer / Show Admin" — an Organizer's own preview toggle,
 * ported from showstaff.html's role-select/setViewRole/moneyHidden. Lets an
 * Organizer (or a SuperAdmin currently impersonating one) see their own
 * workspace exactly as a Show Admin would — money hidden, Financial
 * unreachable — without creating or touching a real staff_assignments row.
 *
 * Deliberately narrower than superadmin/data/impersonation.ts's cookie: this
 * never changes what the caller's session can read (RLS never sees this
 * cookie at all, and canPreview() only gates who may set it, not what it
 * unlocks), only what getOrganizerContext.canViewMoney computes for pages
 * that were already going to render for this same person. There is no
 * privilege boundary to defend the way enterAsOrganizer's cookie has to
 * defend one — flipping it can only ever hide money from someone who could
 * already see it, never reveal anything.
 */
const PREVIEW_ROLE_COOKIE = 'fa_preview_role';

/** Eight hours — a preview session, not a standing state to forget about. */
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

  // Matches the dropdown's own visibility rule in organizer-shell.tsx: only
  // meaningful for someone who genuinely has full, inherent access already —
  // a real Show Admin is never offered this (see that file's doc comment).
  return profile?.platform_role === 'Organizer' || profile?.platform_role === 'SuperAdmin';
}

/**
 * `returnTo` is the page the dropdown was used from — a client-supplied path,
 * so it is validated the same way `/auth/callback`'s `next` param is (single
 * leading slash, no protocol-relative host) before ever reaching `redirect()`.
 *
 * The redirect itself, not a client-side router.refresh(), is what makes this
 * reliable: a Server Action's cookie write only lands in the browser once its
 * response is processed, and a soft refresh fired right after can still race
 * that — the exact same reason enterAsOrganizer above redirects rather than
 * asking the caller to refresh. A full navigation has no such race, since the
 * browser cannot form the next request until the Set-Cookie from this one has
 * already landed.
 */
export async function setPreviewRole(
  role: 'organizer' | 'showadmin',
  returnTo?: string
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

  // redirect() alone can no-op when the target is the same path the caller is
  // already on — the overwhelmingly common case here, since the dropdown
  // always redirects back to wherever it was used from. revalidatePath forces
  // a fresh render regardless: 'layout' for the (dashboard) shell — the
  // sidebar that renders this very dropdown and hides Financial — and the
  // target page itself, for pages gated on canViewMoney (Financial chief
  // among them).
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

/**
 * True only when the real caller is entitled to preview AND has the cookie
 * set — never a privilege grant either way, see setPreviewRole's doc comment.
 */
export async function getPreviewingAsShowAdmin(): Promise<boolean> {
  const store = await cookies();
  if (store.get(PREVIEW_ROLE_COOKIE)?.value !== 'showadmin') return false;
  return canPreview();
}
