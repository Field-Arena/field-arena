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
 *
 * Where an invite should land — AFTER `/set-password` — is read from the
 * invited user's own `user_metadata.next`, set by whichever mutation sent
 * the invite (see `createOrganization`/`addSuperAdmin` etc.) — not from a
 * `?next=` query param on the link. GoTrue's own `{{ .RedirectTo }}`
 * email-template variable was tried first and confirmed, empirically, to
 * truncate down to the bare origin regardless of `uri_allow_list` — every
 * invite landed on `/dashboard` no matter what path was requested.
 * `user_metadata` survives untouched because it never round-trips through
 * GoTrue's redirect-URL handling at all.
 *
 * `type === 'invite'` always goes to `/set-password` first rather than
 * straight to `next`, regardless of what `next` is — `verifyOtp` hands back
 * a session but the account behind it has no password yet, and the login
 * form's default path is email + password. `/set-password` reads the same
 * `user_metadata.next` once a password is actually set. Every other type
 * (recovery, magic link, signup confirmation) already implies a password
 * exists or doesn't matter here, so those go straight to `next` as before.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (tokenHash && type) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}${ROUTES.setPassword}`);
      }

      // `user_metadata` is untyped by design, so the read is widened to unknown
      // and narrowed below rather than trusted as a string.
      const metaNext: unknown = data.user?.user_metadata.next;
      const next = safeNext(typeof metaNext === 'string' ? metaNext : searchParams.get('next'));
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=${encodeURIComponent(error.message)}`,
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
