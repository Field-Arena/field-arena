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

export const ROLE_RAIL = [
  { key: 'superadmin', icon: 'shield', label: 'Super Admin' },
  { key: 'organizer', icon: 'grid', label: 'Organizer' },
  { key: 'judge', icon: 'check-square', label: 'Judge' },
  { key: 'scribe', icon: 'flag', label: 'Scribe' },
  { key: 'announcer', icon: 'scale', label: 'Announcer' },
  { key: 'rider', icon: 'pencil', label: 'Rider' },
  { key: 'vendor', icon: 'speaker', label: 'Vendor' },
  { key: 'staff', icon: 'briefcase', label: 'Show staff' },
] as const;

export const CURRENT_ORG = 'Peachtree Dressage Association';
export const CURRENT_ORG_SHORT = 'Peachtree Dressage Assoc.';
export const CURRENT_STAGE = 'complete';

export const CURRENT_SHOW = {
  name: 'Blue Ridge Dressage Weekend',
  dateLabel: 'Jul 10 – Jul 12, 2026',
  venue: 'Wills Park Equestrian',
} as const;

export const DASHBOARD_STATS = [
  { label: 'Total riders', value: '115', sub: 'this show · view list →' },
  { label: 'Entries sold', value: '226', sub: 'this show · view list →' },
  { label: 'Horses', value: '114', sub: 'this show · view list →' },
  { label: 'Vendor spaces', value: '0', sub: 'booths sold · view list →' },
  { label: 'Revenue (all-in)', value: '$21,690', sub: 'this show', revenue: true },
] as const;

export const RING_TIMERS = [
  { ring: 'Ring 1', delay: '+3m' },
  { ring: 'Ring 2', delay: '+7m' },
  { ring: 'Ring 3', delay: '+12m' },
] as const;

export const SHOW_INVENTORY = [
  { name: 'Total riders', qty: '115', revenue: '$15,780' },
  { name: 'Stabling', qty: '65', revenue: '$3,310' },
  { name: 'Add-ons', qty: '109', revenue: '$2,600' },
  { name: 'Vendors', qty: '0', revenue: '$0' },
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
