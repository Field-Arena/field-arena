/**
 * The organizer sidebar, transcribed from the legacy showstaff.html sidebar
 * (lines 862-871) — nine items, with their labels and `data-tip` tooltip text
 * verbatim.
 *
 * Two corrections against the earlier version of this file: the labels are spaced
 * ("Member Database", not "MemberDatabase") and the financial section is called
 * "Financial", not "Billing". Master Schedule, Venues and Horses were missing
 * entirely; Documents was invented — legacy has no Documents item in this
 * sidebar, because per-show documents live inside Show Manager.
 */
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

/**
 * Per-role sidebar navigation, from each legacy view's own sections.
 *
 * Keyed by platform_role so the shell can pick one without a switch statement.
 * Judge and Scribe share a nav because they shared judge-scribe.html — the
 * difference is scope (whose assignments), not which screens exist.
 */
export const ROLE_NAV: Record<
  string,
  { key: string; label: string; icon: string; href: string; tip: string }[]
> =
  {
    Judge: [
      { key: 'assignments', label: 'My Assignments', icon: 'dashboard', href: '/dashboard/judging', tip: 'Every class you are on a panel for' },
      { key: 'schedule', label: 'Ring Times', icon: 'schedule', href: '/dashboard/judging/schedule', tip: "Today's ring times for your assignments" },
    ],
    Scribe: [
      { key: 'assignments', label: 'My Assignments', icon: 'dashboard', href: '/dashboard/judging', tip: 'Every class you are recording for' },
      { key: 'schedule', label: 'Ring Times', icon: 'schedule', href: '/dashboard/judging/schedule', tip: "Today's ring times for your assignments" },
    ],
    Announcer: [
      { key: 'live', label: 'Up Next', icon: 'dashboard', href: '/dashboard/announcing', tip: 'Ring status and who rides next' },
      { key: 'results', label: 'Results — Live', icon: 'financial', href: '/dashboard/announcing/results', tip: 'Published standings, class by class' },
    ],
    ShowStaff: [
      { key: 'ops', label: 'Show Operations', icon: 'dashboard', href: '/dashboard/operations', tip: 'Live board and on-the-ground operations' },
      { key: 'directory', label: 'Directories', icon: 'users', href: '/dashboard/operations/directory', tip: 'Rider, horse and vendor directories' },
    ],
    Vendor: [
      { key: 'bookings', label: 'My Bookings', icon: 'eventsales', href: '/dashboard/vendor', tip: 'Your booth space across every organizer' },
      { key: 'discover', label: 'Reserve Space', icon: 'venues', href: '/dashboard/vendor/discover', tip: 'Shows with booth space still available' },
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
