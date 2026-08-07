/** Route paths, centralised so a rename is one edit rather than a grep. */
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  authCallback: '/auth/callback',
  setPassword: '/set-password',

  onboarding: '/onboarding',

  /**
   * The rider portal — matches RIDER_WORKSPACE.href (role-workspaces.ts).
   * Deliberately absent from PROTECTED_PREFIXES below: unlike /dashboard, this
   * tree must stay browsable with no session at all (a show's ticket page is
   * public — "buy first, account second"), so gating happens page-by-page
   * instead of at the proxy.
   */
  rider: '/rider',

  dashboard: '/dashboard',
  shows: '/dashboard/shows',
  members: '/dashboard/members',
  users: '/dashboard/users',
  documents: '/dashboard/documents',
  eventSales: '/dashboard/event-sales',
  billing: '/dashboard/billing',
} as const;

/**
 * Prefixes requiring a signed-in user. Checked by the proxy, which is a UX
 * measure only — it redirects instead of rendering an empty page. The actual
 * protection is RLS: an unauthenticated request to these routes returns no rows
 * regardless of whether the proxy ran.
 */
export const PROTECTED_PREFIXES = ['/dashboard'] as const;

/** Routes a signed-in user should be bounced away from. */
export const GUEST_ONLY_ROUTES = ['/login', '/signup'] as const;
