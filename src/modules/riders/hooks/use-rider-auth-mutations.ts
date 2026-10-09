'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  resendRiderSignUpCode,
  signInRider,
  signOutRider,
  signUpRider,
  verifyRiderSignUpCode,
} from '@/modules/riders/data/mutations';
import type {
  RiderResendCodeInput,
  RiderSignInInput,
  RiderSignUpInput,
  RiderVerifyInput,
} from '@/modules/riders/schemas';
import type {
  RiderResendOutcome,
  RiderSignInOutcome,
  RiderSignUpOutcome,
  RiderVerifyOutcome,
} from '@/modules/riders/types';

/* After sign-up, code verification or sign-in the session cookie is new, and
 * the rider usually returns to the page they're already on (the show's entry
 * page). router.push to the same URL is a no-op and router.refresh can run
 * before the cookie is picked up, so the page kept showing the sign-in card
 * until a manual reload. A full navigation always renders the signed-in view. */
function goToSignedInPage(url: string) {
  window.location.assign(url);
}

export function useSignUpRider(options?: {
  onVerifyNeeded?: (email: string) => void;
  onAlreadyRegistered?: () => void;
  returnTo?: string;
}) {
  return useMutation<RiderSignUpOutcome, Error, RiderSignUpInput>({
    mutationFn: (input) => signUpRider(input, options?.returnTo),
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
          goToSignedInPage(outcome.redirectTo);
      }
    },
  });
}

export function useVerifyRiderSignUpCode(returnTo?: string) {
  return useMutation<RiderVerifyOutcome, Error, RiderVerifyInput>({
    mutationFn: (input) => verifyRiderSignUpCode(input, returnTo),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('Email confirmed.');
      goToSignedInPage(outcome.redirectTo);
    },
  });
}

export function useSignInRider(options?: {
  onVerifyNeeded?: (email: string) => void;
  returnTo?: string;
}) {
  return useMutation<RiderSignInOutcome, Error, RiderSignInInput>({
    mutationFn: (input) => signInRider(input, options?.returnTo),
    onSuccess: (outcome) => {
      switch (outcome.status) {
        case 'verify':
          toast.success('Confirm your email first — we sent you a new code.');
          options?.onVerifyNeeded?.(outcome.email);
          return;
        case 'error':
          return;
        default:
          toast.success('Signed in.');
          goToSignedInPage(outcome.redirectTo);
      }
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
