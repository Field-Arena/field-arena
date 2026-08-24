'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { Button } from '@/shared/ui/shadcn/button';
import { signUpSchema, type SignUpInput } from '@/modules/auth/schemas';
import {
  useSignUp,
  useVerifyEmail,
  useResendEmailCode,
} from '@/modules/auth/hooks/use-auth-mutations';
import type { SignUpStep } from '@/modules/auth/types';

export function SignUpForm() {
  const [step, setStep] = useState<SignUpStep>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

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

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  const password = useWatch({ control: form.control, name: 'password' });
  const { errors } = form.formState;

  if (step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h1 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[40px] leading-[1.04] font-medium tracking-[-.022em]">
          Verify your email
        </h1>
        <p className="text-fa-muted mb-[22px] text-[15.5px] leading-[1.58]">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="border-line-mint bg-mint mb-[30px] inline-flex items-center gap-2.5 rounded-[10px] border py-2.5 pr-3 pl-3.5">
          <MailIcon className="text-fa-muted size-[15px]" aria-hidden />
          <span className="text-forest text-sm font-medium">{email}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep('account');
              setCode('');
              setFormError(null);
              verify.reset();
            }}
            className="border-line-mint-2 text-fa-muted hover:text-gold active:translate-y-0 h-auto rounded-none border-l bg-transparent px-0 py-0.5 pl-[11px] text-[12.5px] font-bold transition-colors hover:bg-transparent"
          >
            Change
          </Button>
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
              },
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

          <div className="border-line flex items-center justify-between gap-4 border-b pb-[26px]">
            <span className="text-fa-muted text-[13.5px]">Didn&apos;t get it? Check spam, or</span>
            <Button
              type="button"
              variant="ghost"
              disabled={cooldown > 0 || resend.isPending}
              onClick={() => {
                resend.mutate(
                  { email },
                  {
                    onSuccess: () => {
                      setCooldown(RESEND_COOLDOWN_SECONDS);
                    },
                  },
                );
              }}
              className="text-forest hover:text-gold active:translate-y-0 h-auto bg-transparent px-0 py-0 text-[13.5px] font-bold transition-colors hover:bg-transparent disabled:cursor-default disabled:text-[#9AA6A0] disabled:hover:text-[#9AA6A0]"
            >
              {cooldown > 0 ? `Resend in ${String(cooldown)}s` : 'Send a new code'}
            </Button>
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
      <h1 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[40px] leading-[1.04] font-medium tracking-[-.022em]">
        Create your account
      </h1>
      <p className="text-fa-muted mb-[34px] text-[15.5px] leading-[1.58]">
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

        <p className="text-fa-muted-2 mt-[18px] text-center text-[12.5px] leading-[1.6]">
          By continuing you agree to the{' '}
          <Link
            href="/terms-of-service"
            className="border-gold text-forest hover:border-forest border-b font-semibold transition-colors"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="border-gold text-forest hover:border-forest border-b font-semibold transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
