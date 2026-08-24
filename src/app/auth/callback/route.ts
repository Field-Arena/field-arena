import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';

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

// `next` is attacker-controllable via the emailed URL — same-site absolute paths only.
function safeNext(value: string | null): string {
  if (!value) return ROUTES.dashboard;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.dashboard;
  return value;
}
