import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { escapeLikePattern } from '@/shared/lib/escape-like-pattern';
import type { OrgAccessBlock } from '@/modules/staff/types';

/* Which of the caller's organizations are suspended or deleted.
 *
 * Read with the admin client on purpose: once RLS hides a suspended org from
 * its own staff (see 20261002133000_admin_followups.sql), the session client
 * can no longer see the org row — or the shows/owner rows that tie the user to
 * it — so it couldn't tell "suspended" apart from "has no org". The ids are
 * derived from the session profile only, never from caller input.
 *
 * SuperAdmin is never blocked: they reinstate orgs and impersonate them. */
export const getOrgAccessBlock = cache(async (): Promise<OrgAccessBlock> => {
  const none: OrgAccessBlock = { blockedOrgIds: [], allBlocked: null };
  const profile = await getStaffProfile();
  if (!profile || profile.platform_role === 'SuperAdmin') return none;

  const admin = createAdminClient();
  const email = profile.email.trim().toLowerCase();

  const [owned, byUser, byEmail] = await Promise.all([
    admin.from('organization_owners').select('org_id').eq('user_id', profile.id),
    admin.from('staff_assignments').select('shows(org_id)').eq('user_id', profile.id),
    email
      ? admin
          .from('staff_assignments')
          .select('shows(org_id)')
          .ilike('email', escapeLikePattern(email))
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (owned.error) throw owned.error;
  if (byUser.error) throw byUser.error;
  if (byEmail.error) throw byEmail.error;

  const orgIds = new Set<string>();
  if (profile.org_id) orgIds.add(profile.org_id);
  for (const row of owned.data) orgIds.add(row.org_id);
  for (const row of [...byUser.data, ...byEmail.data]) {
    const show = row.shows as { org_id: string } | null;
    if (show?.org_id) orgIds.add(show.org_id);
  }
  if (orgIds.size === 0) return none;

  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, suspended, deleted_at')
    .in('id', [...orgIds]);
  if (error) throw error;

  const blocked = orgs.filter((o) => o.suspended || o.deleted_at !== null);
  if (blocked.length === 0) return none;

  const blockedOrgIds = blocked.map((o) => o.id);
  // Every org this person works for is closed: nothing left to show them.
  const allBlocked =
    blocked.length === orgIds.size
      ? blocked.every((o) => o.deleted_at !== null)
        ? 'deleted'
        : 'suspended'
      : null;
  return { blockedOrgIds, allBlocked };
});
