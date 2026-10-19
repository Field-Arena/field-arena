import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import {
  IMPERSONATION_COOKIE,
  PREVIEW_SHOW_COOKIE,
  RAIL_ROLE_COOKIE,
} from '@/shared/constants/view-as';

// Server-only readers for the SuperAdmin "view as" cookies. The writers are
// Server Actions in `@/modules/superadmin/data/session-mutations`.

async function callerIsSuperAdmin(): Promise<boolean> {
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

  return profile?.platform_role === 'SuperAdmin';
}

/** The impersonated org id, but only for a caller who is really a SuperAdmin. */
export async function getImpersonatedOrgId(): Promise<string | null> {
  const store = await cookies();
  const orgId = store.get(IMPERSONATION_COOKIE)?.value;
  if (!orgId) return null;

  return (await callerIsSuperAdmin()) ? orgId : null;
}

export async function getRailRole(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(RAIL_ROLE_COOKIE)?.value;
  if (!value) return null;
  if (value !== 'Rider' && !ROLE_WORKSPACES[value]) return null;
  return value;
}

/** The previewed show id, but only for a caller who is really a SuperAdmin. */
export async function getPreviewShowId(): Promise<string | null> {
  const store = await cookies();
  const showId = store.get(PREVIEW_SHOW_COOKIE)?.value;
  if (!showId) return null;

  return (await callerIsSuperAdmin()) ? showId : null;
}
