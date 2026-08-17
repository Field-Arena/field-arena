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
  /** True when a SuperAdmin is viewing this workspace as an organizer. */
  impersonating: boolean;
  /** True when an Organizer (or an impersonating SuperAdmin) is previewing as Show Admin — see data/preview-role.ts. */
  previewingAsShowAdmin: boolean;
  /** Every org this person has real access to — see data/org-selection.ts. Empty while impersonating (that cookie already picks the org). */
  memberOrgs: MemberOrg[];
}

/**
 * Everything an organizer-workspace page needs before it can render anything.
 *
 * Extracted because seven pages need the same four facts, and two of them are
 * easy to get subtly wrong in a way that is also a security bug:
 *
 *  - A ShowAdmin's organization does NOT come from users.org_id. That column is
 *    null for them by design; their authority comes from a staff_assignments row
 *    for one specific show. The legacy code named treating ShowAdmin as
 *    org-scoped as a real authorization bug — it let a ShowAdmin invited to one
 *    show reach every show in the organization.
 *
 *  - Money visibility is not a role check. canViewMoney defaults to false for
 *    every staff role including Show Admin, and must be granted per person, so it
 *    is resolved through the database function rather than inferred.
 */
export async function getOrganizerContext(requestedShowId?: string): Promise<OrganizerContext> {
  const profile = await getStaffProfile();
  if (!profile) redirect('/login?error=no_profile');

  const supabase = await createServerClient();

  /**
   * Impersonation takes precedence when present. getImpersonatedOrgId returns
   * null for anyone who is not a SuperAdmin, so a stale or forged cookie cannot
   * redirect an ordinary user's workspace at another organization.
   */
  const impersonatedOrgId = await getImpersonatedOrgId();

  /**
   * A SuperAdmin who is not impersonating has no business on an organizer route.
   * The dashboard layout renders the console shell for them, so letting one
   * through produces console chrome wrapped around organizer content — two
   * different workspaces stitched together. Sending them to the console is
   * coherent, and "Enter as organizer" is the way in.
   *
   * Guarded here rather than per page because all ten organizer pages call this,
   * and a layout cannot see the pathname to decide.
   */
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

  // A SuperAdmin viewing as an organizer sees what the organizer sees, which
  // includes money — they can already read it directly in the console.
  let canViewMoney = profile.platform_role === 'Organizer' || impersonatedOrgId !== null;
  if (!canViewMoney && currentShow) {
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: currentShow.id,
      permission_key: 'canViewMoney',
    });
    canViewMoney = allowed === true;
  }

  // The "Viewing as Show Admin" preview only ever narrows what this same
  // inherently-full-access person sees — never a real permission change, see
  // preview-role.ts's doc comment. A real Show Admin's own canViewMoney above
  // is untouched by this: it already came from their per-person grant.
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
