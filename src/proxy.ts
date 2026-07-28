import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { GUEST_ONLY_ROUTES, PROTECTED_PREFIXES, ROUTES } from '@/shared/constants/routes';
import { env } from '@/shared/lib/env';

/**
 * Refreshes the Supabase session on every request and redirects around the auth
 * boundary.
 *
 * Two things here are easy to get subtly wrong and both cause silent logouts:
 *
 *  1. The response object must be the one Supabase wrote cookies onto. A
 *     refreshed access token arrives as a Set-Cookie on `response`; returning a
 *     different NextResponse discards it, so the session expires on its own
 *     schedule and the user is logged out mid-session with no error anywhere.
 *
 *  2. On redirect, those cookies have to be copied across to the redirect
 *     response for the same reason — otherwise the very request that refreshes
 *     the token is also the one that throws it away.
 *
 * This is a UX layer, not a security boundary. It redirects rather than letting
 * a protected page render empty. RLS is what actually protects the data, so a
 * request that slips past this matcher still returns nothing.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), not getSession(): getSession reads the cookie without verifying
  // it against the auth server, so a tampered or expired token would be treated
  // as a valid user here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isGuestOnly = GUEST_ONLY_ROUTES.some((route) => pathname === route);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    // Preserved so login can return the user where they were headed.
    url.searchParams.set('next', pathname);
    return copyCookies(response, NextResponse.redirect(url));
  }

  /**
   * A signed-in user has no business on the login or sign-up form — EXCEPT when
   * the app itself sent them there to explain something, which it signals with
   * an `error` param.
   *
   * Without that exception this is an infinite redirect. The dashboard layout
   * bounces an authenticated account that has no users/riders row to
   * `/login?error=no_profile`; the rule below would bounce it straight back to
   * /dashboard; the layout would bounce it again. The browser gives up with
   * ERR_TOO_MANY_REDIRECTS and the user never sees the message. Every account
   * predating the schema rebuild is in exactly that state, so this is a live
   * case rather than a hypothetical.
   */
  if (isGuestOnly && user && !request.nextUrl.searchParams.has('error')) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = '';
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

/** See note 2 above — a redirect must carry the refreshed session forward. */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and image files. Session refresh has to
     * run on real navigations, but running it against every icon request would
     * mean an auth round trip per asset.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
