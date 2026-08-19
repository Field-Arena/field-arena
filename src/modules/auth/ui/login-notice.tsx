'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { AuthAlert } from '@/shared/ui/auth/auth-primitives';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';

const MESSAGES: Record<string, string> = {
  no_profile:
    'This account is signed in but is not set up on Field & Arena yet, so there is no workspace to open. Ask your organizer or a platform admin to invite you — or sign out and use a different account.',

  pending_invite:
    'Your email is confirmed, but this account is not set up on Field & Arena yet. Ask your organizer or a platform admin to invite you, then sign in.',
  missing_code: 'That link is incomplete. Request a new one and try again.',
};

export function LoginNotice({ error }: { error: string }) {
  const signOut = useSignOut();
  const message = MESSAGES[error] ?? error;

  return (
    <div className="mb-6 space-y-3">
      <AuthAlert tone="error">{message}</AuthAlert>
      {error === 'no_profile' && (
        <Button
          type="button"
          variant="outline"
          disabled={signOut.isPending}
          onClick={() => {
            signOut.mutate();
          }}
          className="border-line-strong text-forest hover:border-gold h-auto w-full rounded-[10px] bg-white px-4 py-3 text-sm font-semibold hover:bg-white"
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      )}
    </div>
  );
}
