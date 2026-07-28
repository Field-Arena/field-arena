export const ORGANIZER_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/dashboard' },
  { key: 'members', label: 'MemberDatabase', icon: 'database', href: '/dashboard/members' },
  { key: 'shows', label: 'ShowManager', icon: 'pencil', href: '/dashboard/shows' },
  { key: 'users', label: 'Users', icon: 'users', href: '/dashboard/users' },
  { key: 'documents', label: 'Documents', icon: 'doc', href: '/dashboard/documents' },
  { key: 'eventsales', label: 'EventSales', icon: 'tag', href: '/dashboard/event-sales' },
  { key: 'billing', label: 'Billing', icon: 'billing', href: '/dashboard/billing' },
] as const;

/**
 * Per-role sidebar navigation, from each legacy view's own sections.
 *
 * Keyed by platform_role so the shell can pick one without a switch statement.
 * Judge and Scribe share a nav because they shared judge-scribe.html — the
 * difference is scope (whose assignments), not which screens exist.
 */
export const ROLE_NAV: Record<string, { key: string; label: string; icon: string; href: string }[]> =
  {
    Judge: [
      { key: 'assignments', label: 'My Assignments', icon: 'check-square', href: '/dashboard/judging' },
      { key: 'schedule', label: 'Ring Times', icon: 'grid', href: '/dashboard/judging/schedule' },
    ],
    Scribe: [
      { key: 'assignments', label: 'My Assignments', icon: 'flag', href: '/dashboard/judging' },
      { key: 'schedule', label: 'Ring Times', icon: 'grid', href: '/dashboard/judging/schedule' },
    ],
    Announcer: [
      { key: 'live', label: 'Up Next', icon: 'speaker', href: '/dashboard/announcing' },
      { key: 'results', label: 'Results — Live', icon: 'trophy', href: '/dashboard/announcing/results' },
    ],
    ShowStaff: [
      { key: 'ops', label: 'Show Operations', icon: 'grid', href: '/dashboard/operations' },
      { key: 'directory', label: 'Directories', icon: 'users', href: '/dashboard/operations/directory' },
    ],
    Vendor: [
      { key: 'bookings', label: 'My Bookings', icon: 'tag', href: '/dashboard/vendor' },
      { key: 'discover', label: 'Reserve Space', icon: 'plus', href: '/dashboard/vendor/discover' },
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

export const SHOW_STAGES = [
  { key: 'setup', label: 'Setup' },
  { key: 'sales-open', label: 'Ticket sales open' },
  { key: 'sales-closed', label: 'Ticket sales closed' },
  { key: 'schedule', label: 'Schedule approved' },
  { key: 'live', label: 'Live' },
  { key: 'complete', label: 'Complete' },
] as const;

/* Mock data — stands in until the Supabase data layer is wired. */
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
