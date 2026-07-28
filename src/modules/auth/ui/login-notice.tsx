'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { AuthAlert } from './auth-primitives';
import { useSignOut } from '../hooks/use-auth-mutations';

/**
 * Why another route sent the visitor to the login form.
 *
 * `no_profile` is the one that needs an action rather than just a sentence: the
 * account is genuinely authenticated but has no row in public.users or
 * public.riders, so every RLS policy resolves to nothing and there is no
 * workspace to send them to. Signing out is the only way back to a usable state
 * — without the button they are stuck holding a session that opens nothing.
 */
const MESSAGES: Record<string, string> = {
  no_profile:
    'This account is signed in but is not set up on Field & Arena yet, so there is no workspace to open. Ask your organizer or a platform admin to invite you — or sign out and use a different account.',
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
          className="h-auto w-full rounded-[10px] border-line-strong bg-white px-4 py-3 text-sm font-semibold text-forest hover:border-gold hover:bg-white"
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      )}
    </div>
  );
}
