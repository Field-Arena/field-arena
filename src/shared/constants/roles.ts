/**
 * Platform and per-show roles.
 *
 * IMPORTANT: this list is mirrored by a CHECK constraint on public.users
 * (supabase/migrations/20260727120200_identity.sql). The two must be updated
 * together — adding a role here without a migration means every insert with it
 * is rejected by Postgres, and removing one here without a migration leaves
 * orphaned rows the type system claims cannot exist.
 */
export const PLATFORM_ROLES = [
  'SuperAdmin',
  'Organizer',
  'ShowAdmin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
] as const;

/**
 * The only role that is genuinely organization-wide: the account owner. They are
 * never a staff_assignments row and hold every permission implicitly.
 *
 * ShowAdmin is deliberately NOT here. It reads as an org-level role but its
 * access always originates from one staff_assignments row tied to one show. The
 * legacy codebase called out treating ShowAdmin as org-wide as a real
 * authorization bug: a ShowAdmin invited to a single show could reach every show
 * in the organization. See can_access_org() vs can_manage_show() in the RLS
 * migration, which encode this distinction.
 */
export const ORG_SCOPED_ROLES = ['Organizer'] as const;

/**
 * Roles a show manager may assign. Shared between staff creation and staff
 * editing so an edit cannot set a role that creation would have rejected.
 *
 * Note 'Show Admin' with a space: staff_assignments.role stores the human label,
 * whereas users.platform_role stores 'ShowAdmin'. The legacy code carried the
 * same split and the RLS policies match on the spaced form.
 */
export const GRANTABLE_ROLES = [
  'Show Admin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
] as const;

/** Display order in the role switcher, matching the legacy platform shell. */
export const ROLE_DISPLAY_ORDER = [
  'SuperAdmin',
  'Organizer',
  'ShowAdmin',
  'ShowStaff',
  'Judge',
  'Scribe',
  'Announcer',
  'Vendor',
  'Rider',
] as const;
