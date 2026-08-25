import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { SignUpForm } from '@/modules/auth/ui/signup-form';
import { getRiderProfile, getStaffProfile } from '@/modules/auth/data/queries';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = {
  title: 'Create your account — Field & Arena',
  description:
    'Create a Field & Arena account to enter shows, follow live results, and manage your horses.',
};

export default async function SignUpPage() {
  const [staff, rider] = await Promise.all([getStaffProfile(), getRiderProfile()]);
  if (staff) redirect(ROUTES.dashboard);
  if (rider) redirect(ROUTES.home);

  return (
    <AuthShell step={1} alternate={{ label: 'Sign in', href: ROUTES.login, dialog: true }}>
      <SignUpForm />
    </AuthShell>
  );
}
