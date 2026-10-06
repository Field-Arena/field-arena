import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { listShowsForOrg } from '@/modules/shows';
import { getImpersonatedOrgId } from '@/shared/lib/auth/view-as';
import { getPreviewingAsShowAdmin } from './preview-role';
import { getSelectedOrg } from './org-selection-queries';
import type { MemberOrg } from '../types';
import type { OrganizerContext } from '@/modules/staff/types';

export async function getOrganizerContext(requestedShowId?: string): Promise<OrganizerContext> {
  // None of these three depend on each other's result (each reads its own
  // cookie/session independently) — they used to run one after another,
  // with previewingAsShowAdmin all the way at the bottom of this function
  // despite not needing anything computed in between.
  const [profile, impersonatedOrgId, previewingAsShowAdmin] = await Promise.all([
    getStaffProfile(),
    getImpersonatedOrgId(),
    getPreviewingAsShowAdmin(),
  ]);
  if (!profile) redirect('/login?error=no_profile');

  const supabase = await createServerClient();

  if (profile.platform_role === 'SuperAdmin' && !impersonatedOrgId) {
    redirect('/dashboard/superadmin');
  }

  let orgId: string | null;
  let memberOrgs: MemberOrg[] = [];
  if (impersonatedOrgId) {
    orgId = impersonatedOrgId;
  } else {
    const selection = await getSelectedOrg();
    orgId = selection.orgId;
    memberOrgs = selection.memberOrgs;
  }

  if (!orgId) {
    return {
      profile,
      orgId: null,
      orgName: 'No organization',
      shows: [],
      currentShow: null,
      canViewMoney: false,
      impersonating: false,
      previewingAsShowAdmin: false,
      memberOrgs: [],
    };
  }

  const [{ data: org }, shows] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', orgId).single(),
    listShowsForOrg(orgId),
  ]);

  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ?? shows[0] ?? null;

  // From the per-show grant, not the platform role: an Organizer staffed on
  // someone else's org (selected via the switcher) is only a Show Admin there.
  // has_show_permission already returns true for the org's owner/co-owners and
  // SuperAdmin; with no show yet, org ownership (can_access_org) decides.
  let canViewMoney = impersonatedOrgId !== null;
  if (!canViewMoney) {
    const { data: allowed } = currentShow
      ? await supabase.rpc('has_show_permission', {
          target_show_id: currentShow.id,
          permission_key: 'canViewMoney',
        })
      : await supabase.rpc('can_access_org', { target_org_id: orgId });
    canViewMoney = allowed === true;
  }

  if (previewingAsShowAdmin) canViewMoney = false;

  return {
    profile,
    orgId,
    orgName: org?.name ?? 'Your organization',
    shows,
    currentShow,
    canViewMoney,
    impersonating: impersonatedOrgId !== null,
    previewingAsShowAdmin,
    memberOrgs,
  };
}
