'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { safeInternalPath } from '@/shared/lib/safe-internal-path';
import { SELECTED_ORG_COOKIE } from '@/modules/staff/constants';
import { listMemberOrgs } from './org-selection-queries';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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
  return safeInternalPath(value, '/dashboard');
}
