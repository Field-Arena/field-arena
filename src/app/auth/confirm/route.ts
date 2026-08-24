import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { ROUTES } from '@/shared/constants/routes';

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

      // Read from user_metadata.next, not ?next= — GoTrue's own {{ .RedirectTo }}
      // template variable was tried and empirically truncates to the bare origin.
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

// `next` is attacker-controllable via the emailed URL — same-site absolute paths only.
function safeNext(value: string | null): string {
  if (!value) return ROUTES.dashboard;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.dashboard;
  return value;
}
