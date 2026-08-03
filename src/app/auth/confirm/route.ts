import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Verifies the `token_hash` Supabase mails for invite/recovery/magic-link/
 * signup-confirmation and establishes a session — the counterpart to
 * `/auth/callback`, which only handles the PKCE `?code=` flow.
 *
 * Supabase's default `{{ .ConfirmationURL }}` email link points straight at
 * GoTrue's own `/auth/v1/verify` endpoint, which mints the session itself and
 * appends it to `redirect_to` as an implicit-flow `#access_token=` fragment.
 * That never reaches `/auth/callback` (fragments aren't sent to the server at
 * all) and `createBrowserClient` here doesn't pick up implicit-flow fragments
 * either, so a stock invite link landed on the homepage signed out. The auth
 * email templates instead link here directly with `token_hash`/`type`, and
 * `verifyOtp` exchanges that for a session server-side — no PKCE code, no
 * fragment, works the same for a first click as a copy-pasted link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeNext(searchParams.get('next'));

  if (tokenHash && type) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_token`);
}

/** A single leading slash, and no protocol-relative "//host" form. */
function safeNext(value: string | null): string {
  if (!value) return ROUTES.dashboard;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.dashboard;
  return value;
}
