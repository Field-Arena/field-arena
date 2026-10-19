import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';
import { safeInternalPath } from '@/shared/lib/safe-internal-path';
import { authErrorCode } from '@/shared/lib/auth-error-code';

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
      // A reset link must land on the new-password form, not log straight in.
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}${ROUTES.setPassword}?mode=reset`);
      }

      const metaNext: unknown = data.user?.user_metadata.next;
      const next = safeInternalPath(
        typeof metaNext === 'string' ? metaNext : searchParams.get('next'),
        ROUTES.dashboard,
      );
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth] token verification failed', error.message);
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=${authErrorCode(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_token`);
}
