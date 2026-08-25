'use client';

import { useEffect, useState } from 'react';
import { RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import {
  useResendVendorSignUpCode,
  useSignUpVendor,
  useVerifyVendorSignUpCode,
} from '@/modules/vendors/hooks/use-vendor-auth-mutations';
import type { VendorSignUpInput } from '@/modules/vendors/schemas';

export function useVendorSignUpFlow() {
  const [step, setStep] = useState<'account' | 'verify'>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  const signUp = useSignUpVendor({
    onVerifyNeeded: (confirmedEmail) => {
      setAlreadyRegistered(false);
      setEmail(confirmedEmail);
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verify = useVerifyVendorSignUpCode();
  const resend = useResendVendorSignUpCode();

  function submitAccount(values: VendorSignUpInput): void {
    setAlreadyRegistered(false);
    signUp.mutate(values);
  }

  function submitVerify(): void {
    verify.mutate({ email, token: code });
  }

  function resendCode(): void {
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  function backToAccount(): void {
    setStep('account');
    setCode('');
    verify.reset();
  }

  return {
    step,
    email,
    code,
    setCode,
    cooldown,
    alreadyRegistered,
    signUp,
    verify,
    resend,
    submitAccount,
    submitVerify,
    resendCode,
    backToAccount,
  };
}
