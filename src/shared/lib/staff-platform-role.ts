/* The users.platform_role a freshly-invited staff member is provisioned with.
 * Only ever one of the non-privileged per-show staff roles: whatever string
 * arrives (a CSV cell, a crafted Server Action call), this can never yield
 * SuperAdmin or Organizer — those are granted only by the SuperAdmin console's
 * own dedicated actions. Anything unrecognised falls back to ShowStaff. */
const STAFF_PLATFORM_ROLE_BY_ASSIGNMENT_ROLE: Record<string, string> = {
  'Show Admin': 'ShowAdmin',
  Judge: 'Judge',
  Scribe: 'Scribe',
  Announcer: 'Announcer',
  ShowStaff: 'ShowStaff',
  Vendor: 'Vendor',
};

export function platformRoleForStaff(role: string): string {
  return STAFF_PLATFORM_ROLE_BY_ASSIGNMENT_ROLE[role] ?? 'ShowStaff';
}
