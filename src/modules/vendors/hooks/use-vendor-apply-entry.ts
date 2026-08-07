'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { ROUTES } from '@/shared/constants/routes';
import { applyToVendorShow, resendVendorSignUpCode, signUpVendor, verifyVendorSignUpCode } from '../data/mutations';
import type { ApplyToShowInput, VendorResendCodeInput, VendorSignUpInput, VendorVerifyInput } from '../schemas';

/**
 * Backs VendorApplyEntryForm (the "I'm a Vendor" no-prior-account entry
 * point) — kept out of that UI file per this codebase's own layer rule
 * (ui/ must never import from data/, .claude/rules/layers.md). Combines
 * sign-up (or code verification) with the application submit into one
 * mutation each, rather than two separate hooks racing their own navigation
 * side effects — see signUpVendor's own doc comment for why the account has
 * to exist before applyToVendorShow's RLS-governed insert can run.
 */

interface SignUpAndApplyInput {
  signUp: VendorSignUpInput;
  application: ApplyToShowInput;
}

interface VerifyAndApplyInput {
  verify: VendorVerifyInput;
  application: ApplyToShowInput;
}

type Outcome =
  | { kind: 'verify'; email: string }
  | { kind: 'exists' }
  | { kind: 'applied' };

async function submitApplication(application: ApplyToShowInput): Promise<void> {
  await applyToVendorShow(application);
  toast.success('Application submitted — the organizer will review it.');
}

export function useSignUpAndApplyAsVendor(options: {
  onVerifyNeeded: (email: string) => void;
  onAlreadyRegistered: () => void;
}) {
  const router = useRouter();

  return useMutation<Outcome, Error, SignUpAndApplyInput>({
    mutationFn: async ({ signUp, application }) => {
      const outcome = await signUpVendor(signUp);
      if (outcome.status === 'verify') return { kind: 'verify', email: outcome.email };
      if (outcome.status === 'exists') return { kind: 'exists' };
      if (outcome.status === 'error') throw new Error(outcome.message);
      await submitApplication(application);
      return { kind: 'applied' };
    },
    onSuccess: (outcome) => {
      if (outcome.kind === 'verify') {
        toast.success('Check your inbox for the confirmation code.');
        options.onVerifyNeeded(outcome.email);
        return;
      }
      if (outcome.kind === 'exists') {
        options.onAlreadyRegistered();
        return;
      }
      router.push(`${ROUTES.dashboard}/vendor`);
    },
  });
}

export function useVerifyAndApplyAsVendor() {
  const router = useRouter();

  return useMutation<undefined, Error, VerifyAndApplyInput>({
    mutationFn: async ({ verify, application }) => {
      const outcome = await verifyVendorSignUpCode(verify);
      if (outcome.status === 'error') throw new Error(outcome.message);
      await submitApplication(application);
      return undefined;
    },
    onSuccess: () => {
      router.push(`${ROUTES.dashboard}/vendor`);
    },
  });
}

export function useResendVendorApplyCode() {
  return useMutation({
    mutationFn: (input: VendorResendCodeInput) => resendVendorSignUpCode(input),
    onSuccess: (outcome) => {
      if (outcome.status === 'error') {
        toast.error(outcome.message);
        return;
      }
      toast.success('A new code is on its way.');
    },
    onError: (error: unknown) => {
      toast.error(readableError(error, 'Could not send a new code'));
    },
  });
}
