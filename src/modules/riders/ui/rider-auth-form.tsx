'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import Link from 'next/link';
import { riderSignUpSchema, type RiderSignUpInput } from '../schemas';
import {
  useResendRiderSignUpCode,
  useSignUpRider,
  useVerifyRiderSignUpCode,
} from '../hooks/use-rider-auth-mutations';
import type { RiderSignUpStep } from '../types';
import { ROUTES } from '@/shared/constants/routes';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';

/**
 * Self-service rider sign-up — "buy first, account second," reachable from
 * any show's public ticket page with no prior invite. Same two-step shape
 * as auth module's SignUpForm (create account → confirm the emailed code)
 * and now the same shared UI kit (`@/shared/ui/auth/*`) and copy patterns —
 * mail chip with "Change", resend cooldown, password strength meter — so a
 * rider signing up sees the same polish a staff member does, not a plainer
 * cousin of it. Only the data layer differs: this calls riders' own
 * signUpRider (self-service, no invite check), never auth's
 * signUpWithPassword.
 *
 * Sign-IN is not duplicated here: an existing rider already reaches the
 * standard /login form and lands correctly at ROUTES.rider (see
 * provisionedDestination in auth/data/mutations.ts) — only sign-up needed a
 * rider-specific path, since that is the one place the staff invite-only rule
 * would otherwise reject them.
 */
export function RiderAuthForm() {
  const [step, setStep] = useState<RiderSignUpStep>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const signUpForm = useForm<RiderSignUpInput>({
    resolver: zodResolver(riderSignUpSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

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

  // Resend cooldown — cleared on unmount so a rider who navigates away
  // mid-count doesn't leave an interval running against a dead component.
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
  // which the React Compiler cannot memoize, so it bails out of optimising
  // this whole component.
  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;

  if (step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h2 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.02em] text-forest">
          Verify your email
        </h2>
        <p className="mb-[22px] text-[15px] leading-[1.58] text-fa-muted">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="mb-[26px] inline-flex items-center gap-2.5 rounded-[10px] border border-line-mint bg-mint py-2.5 pl-3.5 pr-3">
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

          <div className="flex items-center justify-between gap-4 border-b border-line pb-[22px]">
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

          <div className="mt-[22px]">
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
      <h2 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.02em] text-forest">
        Create your account
      </h2>
      <p className="mb-[26px] text-[15px] leading-[1.58] text-fa-muted">
        One login to enter classes at any Field &amp; Arena show.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void signUpForm.handleSubmit((values) => {
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
          placeholder="you@example.com"
          error={errors.email?.message}
          {...signUpForm.register('email')}
        />

        <div className="mt-[22px]">
          <AuthPasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...signUpForm.register('password')}
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
      </form>
    </div>
  );
}
