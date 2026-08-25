'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  signInWithPassword,
  signOut,
  requestPasswordReset,
  setPassword,
  signUpWithPassword,
  verifyEmailCode,
  resendEmailCode,
  sendSignInCode,
  verifySignInCode,
} from '@/modules/auth/data/mutations';
import type {
  LoginInput,
  RequestPasswordResetInput,
  SetPasswordInput,
  SignUpInput,
  VerifyEmailInput,
  VerifySignInCodeInput,
} from '@/modules/auth/schemas';
import type {
  SignUpOutcome,
  VerifyOutcome,
  ResendOutcome,
  LoginOutcome,
  SignInCodeOutcome,
} from '@/modules/auth/types';

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

      toast.success('Signed in.');
      router.refresh();
      router.push(outcome.redirectTo);
    },
  });
}

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
          toast.error(outcome.message);
          return;
        default:
          toast.success('Account created.');
          router.refresh();
          router.push(outcome.redirectTo);
      }
    },
  });
}

export function useSetPassword() {
  const router = useRouter();

  return useMutation<VerifyOutcome, Error, SetPasswordInput>({
    mutationFn: (input) => setPassword(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('Password set.');
      router.refresh();
      router.push(outcome.redirectTo);
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
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      window.location.assign('/?signin=1');
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not sign out'));
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => requestPasswordReset(input),

    onSettled: () => {
      toast.success('If that address has an account, a reset link is on its way.');
    },
  });
}

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

      router.refresh();
      router.push(outcome.redirectTo);
    },
  });
}
