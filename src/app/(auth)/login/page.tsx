import type { Metadata } from 'next';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { LoginForm } from '@/modules/auth/ui/login-form';
import { LoginNotice } from '@/modules/auth/ui/login-notice';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = {
  title: 'Sign in — Field & Arena',
};

/**
 * Where the proxy redirects unauthenticated users, and where invite and
 * password-reset links land. The header also renders the same LoginForm in a
 * dialog, which is closer to how the legacy app behaved — but a route has to
 * exist regardless, because a redirect and an emailed link both need a URL.
 *
 * The `error` param is also what stops this page from becoming half of an
 * infinite redirect — see the guest-only rule in proxy.ts.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell alternate={{ label: 'Create an account', href: ROUTES.signup }}>
      {error && (
        <div className="mb-6">
          <LoginNotice error={error} />
        </div>
      )}

      {/* The heading block belongs to the form: it changes with the panel, and
          the reset and code panels have their own. */}
      <LoginForm headingLevel="h1" />
    </AuthShell>
  );
}
