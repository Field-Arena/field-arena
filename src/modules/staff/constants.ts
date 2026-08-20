export const ORGANIZER_NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/dashboard',
    tip: 'Overview of everything across your shows',
  },
  {
    key: 'members',
    label: 'Member Database',
    icon: 'members',
    href: '/dashboard/members',
    tip: "Your organization's full contact database, across every show",
  },
  {
    key: 'shows',
    label: 'Show Manager',
    icon: 'showmanager',
    href: '/dashboard/shows',
    tip: 'Set up, schedule, and run your show — start to finish',
  },
  {
    key: 'schedule',
    label: 'Master Schedule',
    icon: 'schedule',
    href: '/dashboard/schedule',
    tip: 'The master schedule for your currently focused show',
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'users',
    href: '/dashboard/users',
    tip: 'Invite and manage everyone with access',
  },
  {
    key: 'venues',
    label: 'Venues',
    icon: 'venues',
    href: '/dashboard/venues',
    tip: "Your organization's reusable venues — name, contact info, ring layout, and stables, built once and picked up by any show",
  },
  {
    key: 'horses',
    label: 'Horses',
    icon: 'horses',
    href: '/dashboard/horses',
    tip: 'Every horse entered, and what documents are still missing',
  },
  {
    key: 'eventsales',
    label: 'Event Sales',
    icon: 'eventsales',
    href: '/dashboard/event-sales',
    tip: 'Rider entries, stabling, and add-ons',
  },
  {
    key: 'billing',
    label: 'Financial',
    icon: 'financial',
    href: '/dashboard/billing',
    tip: 'Invoices, payouts, and financial reporting',
  },
] as const;

export const ROLE_NAV: Record<
  string,
  { key: string; label: string; icon: string; href: string; tip: string }[]
> = {
  Judge: [
    {
      key: 'assignments',
      label: 'My Assignments',
      icon: 'dashboard',
      href: '/dashboard/judging',
      tip: 'Every class you are on a panel for',
    },
    {
      key: 'panel',
      label: 'Panel & Contacts',
      icon: 'members',
      href: '/dashboard/judging/panel',
      tip: 'Who else is on the panel with you',
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: 'documents',
      href: '/dashboard/judging/documents',
      tip: 'Test sheets and rule references',
    },
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      href: '/dashboard/judging/history',
      tip: "Classes you've completed",
    },
  ],
  Scribe: [
    {
      key: 'assignments',
      label: 'My Assignments',
      icon: 'dashboard',
      href: '/dashboard/judging',
      tip: 'Every class you are recording for',
    },
    {
      key: 'panel',
      label: 'Panel & Contacts',
      icon: 'members',
      href: '/dashboard/judging/panel',
      tip: 'Who else is on the panel with you',
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: 'documents',
      href: '/dashboard/judging/documents',
      tip: 'Test sheets and rule references',
    },
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      href: '/dashboard/judging/history',
      tip: "Classes you've completed",
    },
  ],
  Announcer: [
    {
      key: 'live',
      label: 'Up Next',
      icon: 'dashboard',
      href: '/dashboard/announcing',
      tip: 'Ring status and who rides next',
    },
    {
      key: 'results',
      label: 'Results — Live',
      icon: 'financial',
      href: '/dashboard/announcing/results',
      tip: "Every rider's score as it's confirmed, class by class",
    },
    {
      key: 'contacts',
      label: 'Contacts',
      icon: 'members',
      href: '/dashboard/announcing/contacts',
      tip: 'Judges, scribes, and show staff for this assignment',
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: 'documents',
      href: '/dashboard/announcing/documents',
      tip: 'Rider pronunciation guides, sponsor copy, and rule references',
    },
  ],

  ShowStaff: [
    {
      key: 'ops',
      label: 'Show Operations',
      icon: 'dashboard',
      href: '/dashboard/operations',
      tip: 'Live board and on-the-ground operations',
    },
    {
      key: 'find',
      label: 'Find',
      icon: 'find',
      href: '/dashboard/operations/find',
      tip: 'Look up a rider, horse, or vendor',
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: 'schedule',
      href: '/dashboard/operations/schedule',
      tip: 'The full ring-by-ring running order',
    },
    {
      key: 'riders',
      label: 'Riders',
      icon: 'riders',
      href: '/dashboard/operations/riders',
      tip: 'Every rider entered in this show',
    },
    {
      key: 'horses',
      label: 'Horses',
      icon: 'horses',
      href: '/dashboard/operations/horses',
      tip: 'Every horse entered in this show',
    },
    {
      key: 'stabling',
      label: 'Stabling',
      icon: 'stabling',
      href: '/dashboard/operations/stabling',
      tip: 'Stall assignments and arrivals',
    },
    {
      key: 'vendors',
      label: 'Vendors',
      icon: 'vendors',
      href: '/dashboard/operations/vendors',
      tip: 'Vendor booths and contacts on-site',
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: 'documents',
      href: '/dashboard/operations/documents',
      tip: 'Reference documents for show staff — upload a PDF for judges and scribes',
    },
  ],
  Vendor: [
    {
      key: 'bookings',
      label: 'My Bookings',
      icon: 'eventsales',
      href: '/dashboard/vendor',
      tip: 'Your booth space across every organizer',
    },
    {
      key: 'discover',
      label: 'Reserve Space',
      icon: 'venues',
      href: '/dashboard/vendor/discover',
      tip: 'Shows with booth space still available',
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: 'documents',
      href: '/dashboard/vendor/documents',
      tip: 'Load-in guides, venue maps, and paperwork',
    },
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      href: '/dashboard/vendor/history',
      tip: "Shows you've vended at",
    },
  ],
};

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
