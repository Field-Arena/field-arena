export const ORGANIZER_NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/dashboard',
    tip: 'Overview of everything across your shows',
    group: 'Workspace',
  },
  {
    key: 'shows',
    label: 'Show Manager',
    icon: 'showmanager',
    href: '/dashboard/shows',
    tip: 'Set up, schedule, and run your show — start to finish',
    group: 'Workspace',
  },
  {
    key: 'schedule',
    label: 'Master Schedule',
    icon: 'schedule',
    href: '/dashboard/schedule',
    tip: 'The master schedule for your currently focused show',
    group: 'Workspace',
  },
  {
    key: 'entries',
    label: 'Rider Entries',
    icon: 'entries',
    href: '/dashboard/entries',
    tip: 'Every rider entered in the focused show — horses, classes, and payment',
    group: 'Workspace',
  },
  {
    key: 'members',
    label: 'Member Database',
    icon: 'members',
    href: '/dashboard/members',
    tip: "Your organization's full contact database, across every show",
    group: 'Data',
  },
  {
    key: 'horses',
    label: 'Horses',
    icon: 'horses',
    href: '/dashboard/horses',
    tip: 'Every horse entered, and what documents are still missing',
    group: 'Data',
  },
  {
    key: 'venues',
    label: 'Venues',
    icon: 'venues',
    href: '/dashboard/venues',
    tip: "Your organization's reusable venues — name, contact info, ring layout, and stables, built once and picked up by any show",
    group: 'Data',
  },
  {
    key: 'eventsales',
    label: 'Event Sales',
    icon: 'eventsales',
    href: '/dashboard/event-sales',
    tip: 'Rider entries, stabling, and add-ons',
    group: 'Sales',
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: 'documents',
    href: '/dashboard/documents',
    tip: 'Entry ledger, membership checks, document review, issues, and printing',
    group: 'Sales',
  },
  {
    key: 'billing',
    label: 'Financial',
    icon: 'financial',
    href: '/dashboard/billing',
    tip: 'Invoices, payouts, and financial reporting',
    group: 'Sales',
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'users',
    href: '/dashboard/users',
    tip: 'Invite and manage everyone with access',
    group: 'Admin',
  },
] as const;

export const ADD_USER_ROLES = [
  'Show Admin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
  'Rider',
] as const;

export const USER_ROLE_RANK = [
  'SuperAdmin',
  'Organizer',
  'Show Admin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
  'Rider',
] as const;

export const USER_STATUS_META: Record<
  'not_invited' | 'pending' | 'onboard',
  { label: string; fg: string; bg: string }
> = {
  not_invited: { label: 'Not invited', fg: '#8A857A', bg: '#F1EEE7' },
  pending: { label: 'Pending', fg: '#8A6D0B', bg: '#F7EFD3' },
  onboard: { label: 'On board', fg: '#1F3A2E', bg: '#E4EFE6' },
};

/**
 * Maps a staff_assignments.role value (as stored on the per-show invite) to
 * the workspace key it grants — used to scope the multi-role rail switcher
 * (workspace-roles.ts) and the organization dropdown (org-selection.ts) to
 * the same per-show identity, instead of mixing every org a person touches
 * under any role into one list.
 */
export const ASSIGNMENT_ROLE_TO_WORKSPACE: Record<string, string> = {
  'Show Admin': 'ShowAdmin',
  Judge: 'Judge',
  Scribe: 'Scribe',
  Announcer: 'Announcer',
  ShowStaff: 'ShowStaff',
};

/** Cookie holding the org picked in the Organizer/Show Admin workspace switcher. */
export const SELECTED_ORG_COOKIE = 'fa_selected_org';
