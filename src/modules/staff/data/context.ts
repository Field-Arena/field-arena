import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile, type StaffProfile } from '@/modules/auth/data/queries';
import { listShowsForOrg, type ShowListItem } from '@/modules/shows/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
import { getPreviewingAsShowAdmin } from './preview-role';
import { getSelectedOrg, type MemberOrg } from './org-selection';

export interface OrganizerContext {
  profile: StaffProfile;
  orgId: string | null;
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  canViewMoney: boolean;

  impersonating: boolean;

  previewingAsShowAdmin: boolean;

  memberOrgs: MemberOrg[];
}

export async function getOrganizerContext(requestedShowId?: string): Promise<OrganizerContext> {
  const profile = await getStaffProfile();
  if (!profile) redirect('/login?error=no_profile');

  const supabase = await createServerClient();

  const impersonatedOrgId = await getImpersonatedOrgId();

  if (profile.platform_role === 'SuperAdmin' && !impersonatedOrgId) {
    redirect('/dashboard/superadmin');
  }

  let orgId: string | null;
  let memberOrgs: MemberOrg[] = [];
  if (impersonatedOrgId) {
    orgId = impersonatedOrgId;
  } else {
    const selection = await getSelectedOrg(profile);
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

  const currentShow = shows.find((s) => s.id === requestedShowId) ?? shows[0] ?? null;

  let canViewMoney = profile.platform_role === 'Organizer' || impersonatedOrgId !== null;
  if (!canViewMoney && currentShow) {
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: currentShow.id,
      permission_key: 'canViewMoney',
    });
    canViewMoney = allowed === true;
  }

  const previewingAsShowAdmin = await getPreviewingAsShowAdmin();
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
