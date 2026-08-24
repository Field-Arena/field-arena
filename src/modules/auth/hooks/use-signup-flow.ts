'use client';

import { useState } from 'react';
import type { SignUpStep } from '@/modules/auth/types';

/** Owns the two-step (account → verify) signup state. */
export function useSignupFlow() {
  const [step, setStep] = useState<SignUpStep>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  return {
    step,
    setStep,
    email,
    setEmail,
    code,
    setCode,
    formError,
    setFormError,
    alreadyRegistered,
    setAlreadyRegistered,
  };
}
