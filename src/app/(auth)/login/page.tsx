import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { LoginForm } from '@/modules/auth/ui/login-form';
import { LoginNotice } from '@/modules/auth/ui/login-notice';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = {
  title: 'Sign in — Field & Arena',
};

/**
 * Signing in is a MODAL everywhere in the app, so a bare visit to /login (a
 * typed URL, an old bookmark) is bounced to the marketing home with the login
 * dialog open (`?signin=1`, read by LoginDialogMount) rather than shown this
 * standalone page.
 *
 * The page still renders — never redirects — when an `error` is present, because
 * those cases genuinely need a full page: `no_profile` in particular is an
 * already-authenticated account that must be offered a Sign out button, which
 * the sign-in dialog has no place for. That `error` param is also what stops
 * this route from becoming half of an infinite redirect (an authenticated user
 * reaching bare /login is bounced to /dashboard by the guest-only rule in
 * proxy.ts before this page ever runs, so only anonymous visitors get here).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!error) {
    redirect(`${ROUTES.home}?signin=1`);
  }

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
