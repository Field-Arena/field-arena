import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Exchanges an emailed auth code for a session.
 *
 * Every Supabase email flow lands here — invite acceptance, password reset,
 * email confirmation — because each sends a one-time `code` that has to be
 * traded for a session cookie server-side.
 *
 * The `next` parameter is validated rather than trusted. It arrives in a URL the
 * user can edit, so passing it straight to a redirect is an open-redirect: a
 * crafted link could bounce someone from a legitimate field-arena.com URL to an
 * attacker's page immediately after they authenticate, which is exactly when
 * they are most likely to trust what they see. Only same-site absolute paths are
 * accepted.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_code`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}

/** A single leading slash, and no protocol-relative "//host" form. */
function safeNext(value: string | null): string {
  if (!value) return ROUTES.dashboard;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.dashboard;
  return value;
}
