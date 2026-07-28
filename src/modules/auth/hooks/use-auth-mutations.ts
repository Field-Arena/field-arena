'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInWithPassword, signOut, requestPasswordReset } from '../data/mutations';
import type { LoginInput, RequestPasswordResetInput } from '../schemas';

/**
 * Per layers.md, side effects and toasts live in the mutation hook rather than
 * in the UI component.
 */
export function useSignIn(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginInput) => signInWithPassword(input),
    onSuccess: ({ redirectTo }) => {
      options?.onSuccess?.();
      /**
       * refresh() before push() so Server Components re-render with the new
       * session cookie. Without it the dashboard can render from a cached
       * unauthenticated tree and appear to have no data.
       */
      router.refresh();
      router.push(redirectTo);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not sign in');
    },
  });
}

export function useSignOut() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      router.refresh();
      router.push('/');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not sign out');
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => requestPasswordReset(input),
    // Always the same message — see the note in requestPasswordReset about not
    // leaking whether an account exists.
    onSettled: () => {
      toast.success('If that address has an account, a reset link is on its way.');
    },
  });
}
