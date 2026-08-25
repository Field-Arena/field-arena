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

export const ORG_SCOPED_ROLES = ['Organizer'] as const;

export const GRANTABLE_ROLES = [
  'Show Admin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
] as const;

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
