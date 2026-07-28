import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile, type StaffProfile } from '@/modules/auth/data/queries';
import { listShowsForOrg, type ShowListItem } from '@/modules/shows/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';

export interface OrganizerContext {
  profile: StaffProfile;
  orgId: string | null;
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  canViewMoney: boolean;
  /** True when a SuperAdmin is viewing this workspace as an organizer. */
  impersonating: boolean;
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
export async function getOrganizerContext(
  requestedShowId?: string
): Promise<OrganizerContext> {
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

  let orgId = impersonatedOrgId ?? profile.org_id;
  if (!orgId) {
    const { data: assignment } = await supabase
      .from('staff_assignments')
      .select('shows(org_id)')
      .eq('user_id', profile.id)
      .limit(1)
      .maybeSingle();
    orgId = (assignment as { shows?: { org_id: string } | null } | null)?.shows?.org_id ?? null;
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

  return {
    profile,
    orgId,
    orgName: org?.name ?? 'Your organization',
    shows,
    currentShow,
    canViewMoney,
    impersonating: impersonatedOrgId !== null,
  };
}
