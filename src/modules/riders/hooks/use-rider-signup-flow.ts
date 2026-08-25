'use client';

import { useEffect, useState } from 'react';
import {
  useResendRiderSignUpCode,
  useSignUpRider,
  useVerifyRiderSignUpCode,
} from '@/modules/riders/hooks/use-rider-auth-mutations';
import type { RiderSignUpInput } from '@/modules/riders/schemas';
import type { RiderSignUpStep } from '@/modules/riders/types';
import { RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';

export function useRiderSignUpFlow() {
  const [step, setStep] = useState<RiderSignUpStep>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const signUp = useSignUpRider({
    onVerifyNeeded: (confirmedEmail) => {
      setFormError(null);
      setAlreadyRegistered(false);
      setEmail(confirmedEmail);
      setCode('');
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verify = useVerifyRiderSignUpCode();
  const resend = useResendRiderSignUpCode();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  function submitSignUp(values: RiderSignUpInput) {
    setFormError(null);
    setAlreadyRegistered(false);
    signUp.mutate(values, {
      onSuccess: (outcome) => {
        if (outcome.status === 'error') setFormError(outcome.message);
      },
      onError: (error) => {
        setFormError(error.message);
      },
    });
  }

  function submitVerify() {
    setFormError(null);
    verify.mutate(
      { email, token: code },
      {
        onSuccess: (outcome) => {
          if (outcome.status === 'error') setFormError(outcome.message);
        },
        onError: (error) => {
          setFormError(error.message);
        },
      },
    );
  }

  function resendCode() {
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  function changeEmail() {
    setStep('account');
    setCode('');
    setFormError(null);
    verify.reset();
  }

  return {
    step,
    email,
    code,
    setCode,
    cooldown,
    formError,
    alreadyRegistered,
    submitSignUp,
    submitVerify,
    resendCode,
    changeEmail,
    isSigningUp: signUp.isPending,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
  };
}
