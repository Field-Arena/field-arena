import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile, type StaffProfile } from '@/modules/auth/data/queries';
import { listShowsForOrg, type ShowListItem } from '@/modules/shows/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
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

/* With no show picked, open the one happening soonest: live first, then
 * published shows by start date, then unpublished, then undated. Finished
 * shows only when nothing is coming up. */
function soonestShow(shows: ShowListItem[]): ShowListItem | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const rank = (s: ShowListItem) =>
    s.status === 'live' ? 0 : !s.startDate ? 3 : s.published ? 1 : 2;
  const upcoming = shows
    .filter((s) => (s.endDate ?? s.startDate ?? '9999-12-31') >= today)
    .sort((a, b) => rank(a) - rank(b) || (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  return upcoming[0] ?? shows[0];
}

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

  const currentShow =
    shows.find((s) => s.id === requestedShowId || s.slug === requestedShowId) ??
    soonestShow(shows) ??
    null;

  let canViewMoney = profile.platform_role === 'Organizer' || impersonatedOrgId !== null;
  if (!canViewMoney && currentShow) {
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: currentShow.id,
      permission_key: 'canViewMoney',
    });
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
