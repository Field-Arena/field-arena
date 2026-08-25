import type { Metadata } from 'next';
import { AuthShell } from '@/modules/auth/ui/auth-shell';
import { SetPasswordForm } from '@/modules/auth/ui/set-password-form';

export const metadata: Metadata = {
  title: 'Set your password — Field & Arena',
};

export default function SetPasswordPage() {
  return (
    <AuthShell>
      <SetPasswordForm />
    </AuthShell>
  );
}
