import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';
import { safeInternalPath } from '@/shared/lib/safe-internal-path';
import { authErrorCode } from '@/shared/lib/auth-error-code';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeInternalPath(searchParams.get('next'), ROUTES.dashboard);

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_code`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth] code exchange failed', error.message);
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=${authErrorCode(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
