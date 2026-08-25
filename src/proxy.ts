import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { GUEST_ONLY_ROUTES, PROTECTED_PREFIXES, ROUTES } from '@/shared/constants/routes';
import { env } from '@/shared/lib/env';
import {
  SESSION_PERSISTENCE_COOKIE,
  persistenceDisabled,
  withoutPersistence,
  hardenAuthCookie,
} from '@/shared/lib/supabase/session-persistence';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const persistSession = !persistenceDisabled(
    request.cookies.get(SESSION_PERSISTENCE_COOKIE)?.value,
  );

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
          response.cookies.set(
            name,
            value,
            hardenAuthCookie(persistSession ? options : withoutPersistence(options)),
          );
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isGuestOnly = GUEST_ONLY_ROUTES.some((route) => pathname === route);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.home;
    url.search = '';
    url.searchParams.set('signin', '1');

    url.searchParams.set('next', pathname);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (isGuestOnly && user && !request.nextUrl.searchParams.has('error')) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = '';
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
