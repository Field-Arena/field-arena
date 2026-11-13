// Sidebar nav for the per-show staff roles (Judge, Scribe, Announcer, ShowStaff…).
// Shared by the organizer shell and the SuperAdmin shell's role preview.

export const ROLE_NAV: Record<
  string,
  { key: string; label: string; icon: string; href: string; tip: string; group?: string }[]
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
      key: 'schedule',
      label: 'Schedule',
      icon: 'calendar',
      href: '/dashboard/announcing/schedule',
      tip: "Today's ring times",
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
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      href: '/dashboard/announcing/history',
      tip: "Shows you've announced",
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
      key: 'results',
      label: 'Results',
      // No dedicated 'results' glyph in the icon set; NavIcon silently falls
      // back to 'dashboard' for unknown names, which would duplicate the board
      // icon. 'history' is the closest real match for a results archive.
      icon: 'history',
      href: '/dashboard/operations/results',
      tip: 'Best scores by discipline, and past show results',
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
