import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { LoginForm } from '@/modules/auth/ui/login-form';
import { LoginNotice } from '@/modules/auth/ui/login-notice';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = {
  title: 'Sign in — Field & Arena',
};

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

      <LoginForm headingLevel="h1" />
    </AuthShell>
  );
}
