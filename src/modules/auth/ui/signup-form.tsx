'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { signUpSchema, type SignUpInput } from '../schemas';
import { useSignUp, useVerifyEmail, useResendEmailCode } from '../hooks/use-auth-mutations';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import type { SignUpStep } from '../types';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';

/**
 * Two-step self-service sign-up: create the account, then confirm the emailed
 * code.
 *
 * Which step runs is decided by the SERVER, not assumed here — Supabase only
 * withholds the session when email confirmation is switched on for the project,
 * and if it is off the account is live immediately and the verify step would be
 * an empty ceremony. See SignUpOutcome.
 */
export function SignUpForm() {
  const [step, setStep] = useState<SignUpStep>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  // Expected failures arrive as data rather than as a thrown error, so they are
  // held here instead of read off mutation.error.
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const signUp = useSignUp({
    onVerifyNeeded: (confirmedEmail) => {
      setFormError(null);
      setAlreadyRegistered(false);
      setEmail(confirmedEmail);
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verify = useVerifyEmail();
  const resend = useResendEmailCode();

  // Resend cooldown. Cleared on unmount so a user who navigates away mid-count
  // does not leave an interval running against a dead component.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  // useWatch, not form.watch(): watch() returns a fresh function each render,
  // which the React Compiler cannot memoize, so it bails out of optimising this
  // whole component. useWatch subscribes to the one field instead.
  const password = useWatch({ control: form.control, name: 'password' });
  const { errors } = form.formState;

  if (step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h1 className="mb-2.5 font-[family-name:var(--font-nr)] text-[40px] font-medium leading-[1.04] tracking-[-.022em] text-forest">
          Verify your email
        </h1>
        <p className="mb-[22px] text-[15.5px] leading-[1.58] text-fa-muted">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="mb-[30px] inline-flex items-center gap-2.5 rounded-[10px] border border-line-mint bg-mint py-2.5 pl-3.5 pr-3">
          <MailIcon className="size-[15px] text-fa-muted" aria-hidden />
          <span className="text-sm font-medium text-forest">{email}</span>
          <button
            type="button"
            onClick={() => {
              setStep('account');
              setCode('');
              setFormError(null);
              verify.reset();
            }}
            className="ml-0.5 border-l border-line-mint-2 py-0.5 pl-[11px] text-[12.5px] font-bold text-fa-muted transition-colors hover:text-gold"
          >
            Change
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
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
              }
            );
          }}
        >
          <div className="mb-[18px]">
            <EmailCodeInput value={code} onChange={setCode} disabled={verify.isPending} />
          </div>

          {formError && (
            <div className="mb-[18px]">
              <AuthAlert tone="error">{formError}</AuthAlert>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-b border-line pb-[26px]">
            <span className="text-[13.5px] text-fa-muted">Didn&apos;t get it? Check spam, or</span>
            <button
              type="button"
              disabled={cooldown > 0 || resend.isPending}
              onClick={() => {
                resend.mutate(
                  { email },
                  {
                    onSuccess: () => {
                      setCooldown(RESEND_COOLDOWN_SECONDS);
                    },
                  }
                );
              }}
              className="text-[13.5px] font-bold text-forest transition-colors hover:text-gold disabled:cursor-default disabled:text-[#9AA6A0] disabled:hover:text-[#9AA6A0]"
            >
              {cooldown > 0 ? `Resend in ${String(cooldown)}s` : 'Send a new code'}
            </button>
          </div>

          <div className="mt-[26px]">
            <AuthSubmit pending={verify.isPending} pendingLabel="Verifying…">
              Verify and continue
            </AuthSubmit>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h1 className="mb-2.5 font-[family-name:var(--font-nr)] text-[40px] font-medium leading-[1.04] tracking-[-.022em] text-forest">
        Create your account
      </h1>
      <p className="mb-[34px] text-[15.5px] leading-[1.58] text-fa-muted">
        Start with your email. You can add your organization, disciplines, and team after.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
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
          })(event);
        }}
      >
        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@yourbarn.com"
          error={errors.email?.message}
          {...form.register('email')}
        />

        <div className="mt-[22px]">
          <AuthPasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...form.register('password')}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        {alreadyRegistered ? (
          <div className="mt-5">
            <AuthAlert tone="error">
              An account already exists for this email.{' '}
              <Link href={ROUTES.login} className="font-bold underline underline-offset-2">
                Sign in instead
              </Link>
              .
            </AuthAlert>
          </div>
        ) : (
          formError && (
            <div className="mt-5">
              <AuthAlert tone="error">{formError}</AuthAlert>
            </div>
          )
        )}

        <div className="mt-7">
          <AuthSubmit pending={signUp.isPending} pendingLabel="Creating account…">
            Continue
          </AuthSubmit>
        </div>

        {/* The design underlines these with a 1px GOLD border rather than a text
            underline — see Signup Page.dc.html. */}
        <p className="mt-[18px] text-center text-[12.5px] leading-[1.6] text-fa-muted-2">
          By continuing you agree to the{' '}
          <Link
            href="/terms-of-service"
            className="border-b border-gold font-semibold text-forest transition-colors hover:border-forest"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="border-b border-gold font-semibold text-forest transition-colors hover:border-forest"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
