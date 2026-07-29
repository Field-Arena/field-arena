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

/**
 * Self-service sign-up, which creates a RIDER account.
 *
 * Staff are not self-provisioned: an organizer or platform admin invites them,
 * because a staff row carries an org and a platform role that nobody should be
 * able to grant themselves. See ensureRiderProfile in the auth mutations.
 */
export default async function SignUpPage() {
  // Someone already signed in has nothing to create. Sent to their own
  // workspace rather than shown a form that would fail on a duplicate email.
  const [staff, rider] = await Promise.all([getStaffProfile(), getRiderProfile()]);
  if (staff) redirect(ROUTES.dashboard);
  if (rider) redirect(ROUTES.home);

  return (
    <AuthShell step={1} alternate={{ label: 'Sign in', href: ROUTES.login, dialog: true }}>
      <SignUpForm />
    </AuthShell>
  );
}
