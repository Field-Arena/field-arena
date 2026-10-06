import type { Metadata } from 'next';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { SetPasswordForm } from '@/modules/auth/ui/set-password-form';

export const metadata: Metadata = {
  title: 'Set your password — Field & Arena',
};

// Reached from an invite link (first password) or a reset link (`?mode=reset`).
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;

  return (
    <AuthShell>
      <SetPasswordForm mode={mode === 'reset' ? 'reset' : 'invite'} />
    </AuthShell>
  );
}
