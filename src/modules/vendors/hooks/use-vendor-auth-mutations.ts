'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  resendVendorSignUpCode,
  signUpVendor,
  verifyVendorSignUpCode,
} from '@/modules/vendors/data/mutations';
import type {
  VendorResendCodeInput,
  VendorSignUpInput,
  VendorVerifyInput,
} from '@/modules/vendors/schemas';
import type {
  VendorResendOutcome,
  VendorSignUpOutcome,
  VendorVerifyOutcome,
} from '@/modules/vendors/types';

export function useSignUpVendor(options?: {
  onVerifyNeeded?: (email: string) => void;
  onAlreadyRegistered?: () => void;
}) {
  const router = useRouter();

  return useMutation<VendorSignUpOutcome, Error, VendorSignUpInput>({
    mutationFn: (input) => signUpVendor(input),
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

export function useVerifyVendorSignUpCode() {
  const router = useRouter();

  return useMutation<VendorVerifyOutcome, Error, VendorVerifyInput>({
    mutationFn: (input) => verifyVendorSignUpCode(input),
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

export function useResendVendorSignUpCode() {
  return useMutation<VendorResendOutcome, Error, VendorResendCodeInput>({
    mutationFn: (input) => resendVendorSignUpCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('A new code is on its way.');
    },
  });
}
