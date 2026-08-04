'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  signInWithPassword,
  signOut,
  requestPasswordReset,
  signUpWithPassword,
  verifyEmailCode,
  resendEmailCode,
  sendSignInCode,
  verifySignInCode,
} from '../data/mutations';
import type {
  LoginInput,
  RequestPasswordResetInput,
  SignUpInput,
  VerifyEmailInput,
  VerifySignInCodeInput,
} from '../schemas';
import type {
  SignUpOutcome,
  VerifyOutcome,
  ResendOutcome,
  LoginOutcome,
  SignInCodeOutcome,
} from '../types';

/**
 * Per layers.md, side effects and toasts live in the mutation hook rather than
 * in the UI component.
 */
export function useSignIn(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation<LoginOutcome, Error, LoginInput>({
    mutationFn: (input) => signInWithPassword(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      options?.onSuccess?.();
      /**
       * refresh() before push() so Server Components re-render with the new
       * session cookie. Without it the dashboard can render from a cached
       * unauthenticated tree and appear to have no data.
       */
      toast.success('Signed in.');
      router.refresh();
      router.push(outcome.redirectTo);
    },
  });
}

/**
 * Every outcome here is DATA, not a thrown error — see SignUpOutcome. The form
 * renders the message inline where the design puts it, and the toast repeats it
 * for anyone who has scrolled the alert out of view.
 */
export function useSignUp(options?: {
  onVerifyNeeded?: (email: string) => void;
  onAlreadyRegistered?: () => void;
}) {
  const router = useRouter();

  return useMutation<SignUpOutcome, Error, SignUpInput>({
    mutationFn: (input) => signUpWithPassword(input),
    onSuccess: (outcome) => {
      switch (outcome.status) {
        case 'verify':
          toast.success('Check your inbox for the confirmation code.');
          options?.onVerifyNeeded?.(outcome.email);
          return;
        case 'exists':
          options?.onAlreadyRegistered?.();
          return;
        case 'error':
          // Rendered inline beside the form as well; the toast is what carries
          // it if the visitor has scrolled past the alert.
          toast.error(outcome.message);
          return;
        default:
          // Neutral on purpose: a provisioned account lands in its workspace, an
          // un-provisioned one is routed to the login notice — "Welcome" would be
          // wrong for the latter.
          toast.success('Account created.');
          router.refresh();
          router.push(outcome.redirectTo);
      }
    },
  });
}

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation<VerifyOutcome, Error, VerifyEmailInput>({
    mutationFn: (input) => verifyEmailCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('Email confirmed.');
      router.refresh();
      router.push(outcome.redirectTo);
    },
  });
}

export function useResendEmailCode() {
  return useMutation<ResendOutcome, Error, RequestPasswordResetInput>({
    mutationFn: (input) => resendEmailCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('A new code is on its way.');
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
      toast.error(readableError(error, 'Could not sign out'));
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

/** Sends the one-time sign-in code offered beside the password reset. */
export function useSendSignInCode() {
  return useMutation<SignInCodeOutcome, Error, RequestPasswordResetInput>({
    mutationFn: (input) => sendSignInCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('If that address has an account, a code is on its way.');
    },
  });
}

/** Signs in with the emailed one-time code. Lands exactly where a password would. */
export function useVerifySignInCode(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation<LoginOutcome, Error, VerifySignInCodeInput>({
    mutationFn: (input) => verifySignInCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      options?.onSuccess?.();
      toast.success('Signed in.');
      // See useSignIn — refresh before push, so Server Components re-render with
      // the session cookie rather than from an unauthenticated cached tree.
      router.refresh();
      router.push(outcome.redirectTo);
    },
  });
}
