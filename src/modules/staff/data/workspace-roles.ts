import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { ASSIGNMENT_ROLE_TO_WORKSPACE } from '@/modules/staff/constants';

/**
 * The workspaces a single staff user is actually entitled to — their global
 * platform_role plus every distinct per-show staff role they hold in
 * staff_assignments. This is purely a UI/routing concern: authority for those
 * per-show roles already lives in staff_assignments and is enforced by RLS on
 * every query, so surfacing the extra rail tiles grants no access the user
 * didn't already have. It just restores the multi-role workspace switcher
 * (one person invited as Judge on one show and Announcer on another can reach
 * both workspaces), matching how the legacy app worked.
 */

export async function getUserWorkspaceRoles(profile: {
  id: string;
  email: string | null;
  platform_role: string | null;
}): Promise<string[]> {
  const roles = new Set<string>();

  if (profile.platform_role && ROLE_WORKSPACES[profile.platform_role]) {
    roles.add(profile.platform_role);
  }

  const supabase = await createServerClient();
  const { data: assignments, error } = await supabase
    .from('staff_assignments')
    .select('role')
    .eq('user_id', profile.id);
  if (error) throw error;

  for (const row of assignments) {
    const mapped = row.role ? ASSIGNMENT_ROLE_TO_WORKSPACE[row.role] : undefined;
    if (mapped && ROLE_WORKSPACES[mapped]) roles.add(mapped);
  }

  /* Vendor is never a staff_assignments row (see ensureVendorProfile in
   * modules/vendors/data/mutations.ts), so it can't be picked up by the loop
   * above. Instead, surface it once an organizer has actually approved a
   * booking under this email — matching RLS's own lower(contact)=lower(jwt
   * email) ownership rule, not platform_role. A still-pending booking stays
   * hidden here; it shows up for the organizer to review, not as a workspace
   * tile yet. */
  if (!roles.has('Vendor') && profile.email) {
    const { data: booking, error: vendorError } = await supabase
      .from('vendor_bookings')
      .select('id')
      .ilike('contact', profile.email)
      .in('status', ['approved', 'paid'])
      .limit(1)
      .maybeSingle();
    if (vendorError) throw vendorError;
    if (booking) roles.add('Vendor');
  }

  return [...roles];
}
