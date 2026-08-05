import type { Metadata } from 'next';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { SetPasswordForm } from '@/modules/auth/ui/set-password-form';

export const metadata: Metadata = {
  title: 'Set your password — Field & Arena',
};

/**
 * Reached right after an invite link is verified (see /auth/confirm) —
 * `verifyOtp` establishes a real session but sets no password on the
 * account at all, and the login form's default path is email + password.
 * Without this step, the invite's first session would be the only one that
 * ever worked. Matches legacy, where Clerk's own hosted sign-up UI required
 * a password at this same point in the invite-accept flow.
 */
export default function SetPasswordPage() {
  return (
    <AuthShell>
      <SetPasswordForm />
    </AuthShell>
  );
}
