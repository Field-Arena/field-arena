'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  resendRiderSignUpCode,
  signOutRider,
  signUpRider,
  verifyRiderSignUpCode,
} from '@/modules/riders/data/mutations';
import type { RiderResendCodeInput, RiderSignUpInput, RiderVerifyInput } from '@/modules/riders/schemas';
import type { RiderResendOutcome, RiderSignUpOutcome, RiderVerifyOutcome } from '@/modules/riders/types';

/**
 * Every outcome here is DATA, not a thrown error — see RiderSignUpOutcome.
 * Same shape as auth module's useSignUp, kept as its own hook rather than
 * reused: it calls riders' own signUpRider (self-service, no invite check),
 * not auth's signUpWithPassword.
 */
export function useSignUpRider(options?: {
  onVerifyNeeded?: (email: string) => void;
  onAlreadyRegistered?: () => void;
}) {
  const router = useRouter();

  return useMutation<RiderSignUpOutcome, Error, RiderSignUpInput>({
    mutationFn: (input) => signUpRider(input),
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

export function useVerifyRiderSignUpCode() {
  const router = useRouter();

  return useMutation<RiderVerifyOutcome, Error, RiderVerifyInput>({
    mutationFn: (input) => verifyRiderSignUpCode(input),
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

export function useResendRiderSignUpCode() {
  return useMutation<RiderResendOutcome, Error, RiderResendCodeInput>({
    mutationFn: (input) => resendRiderSignUpCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('A new code is on its way.');
    },
  });
}

export function useSignOutRider() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => signOutRider(),
    onSuccess: () => {
      router.refresh();
      router.push('/');
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not sign out'));
    },
  });
}
