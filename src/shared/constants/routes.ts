export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  authCallback: '/auth/callback',
  setPassword: '/set-password',

  onboarding: '/onboarding',

  rider: '/rider',
  browseShows: '/shows',

  dashboard: '/dashboard',
  shows: '/dashboard/shows',
  members: '/dashboard/members',
  users: '/dashboard/users',
  documents: '/dashboard/documents',
  eventSales: '/dashboard/event-sales',
  billing: '/dashboard/billing',
} as const;

export const PROTECTED_PREFIXES = ['/dashboard'] as const;

export const GUEST_ONLY_ROUTES = ['/login', '/signup'] as const;
