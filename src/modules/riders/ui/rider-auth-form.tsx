'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import {
  riderSignInSchema,
  riderSignUpSchema,
  type RiderSignInInput,
  type RiderSignUpInput,
} from '@/modules/riders/schemas';
import {
  useResendRiderSignUpCode,
  useSignInRider,
  useSignUpRider,
  useVerifyRiderSignUpCode,
} from '@/modules/riders/hooks/use-rider-auth-mutations';
import type { RiderSignUpStep } from '@/modules/riders/types';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { Button } from '@/shared/ui/shadcn/button';

const SWITCH_LINK_CLASSES =
  'text-forest hover:text-gold h-auto rounded-none px-0 py-0 text-[13.5px] font-bold underline underline-offset-2 transition-colors hover:bg-transparent';

/** Sign-up / sign-in for riders. `returnTo` is where the rider lands once they
 * are in — a show's entry page when they started from that show — through
 * sign-up, the email-code step and sign-in alike. `showName` names that show
 * in the heading so the rider knows the account is for entering it. */
export function RiderAuthForm({
  returnTo,
  showName,
  initialStep = 'account',
}: { returnTo?: string; showName?: string; initialStep?: 'account' | 'signin' } = {}) {
  const [step, setStep] = useState<RiderSignUpStep>(initialStep);
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
  const signInForm = useForm<RiderSignInInput>({
    resolver: zodResolver(riderSignInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const goToVerify = (confirmedEmail: string) => {
    setFormError(null);
    setAlreadyRegistered(false);
    setEmail(confirmedEmail);
    setCode('');
    setStep('verify');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const switchStep = (next: 'account' | 'signin') => {
    setFormError(null);
    setAlreadyRegistered(false);
    if (next === 'signin') {
      const typed = signUpForm.getValues('email');
      if (typed) signInForm.setValue('email', typed);
    }
    setStep(next);
  };

  const signUp = useSignUpRider({
    returnTo,
    onVerifyNeeded: goToVerify,
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verify = useVerifyRiderSignUpCode(returnTo);
  const signIn = useSignInRider({ returnTo, onVerifyNeeded: goToVerify });
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

  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;
  const signInErrors = signInForm.formState.errors;
  const showSuffix = showName ? ` to enter ${showName}` : '';

  if (step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
          Verify your email
        </h2>
        <p className="text-fa-muted mb-[22px] text-[15px] leading-[1.58]">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="border-line-mint bg-mint mb-[26px] inline-flex items-center gap-2 rounded-[10px] border py-2 pr-2 pl-3.5">
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
            className="border-line-mint-2 text-fa-muted hover:border-gold hover:text-gold h-auto shrink-0 rounded-full border bg-white px-2.5 py-1 text-[12.5px] font-bold transition-colors hover:bg-white"
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

          <div className="border-line flex items-center justify-between gap-4 border-b pb-[22px]">
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
              className="text-forest hover:text-gold h-auto rounded-none px-0 py-0 text-[13.5px] font-bold transition-colors hover:bg-transparent disabled:cursor-default disabled:text-[#9AA6A0] disabled:opacity-100 disabled:hover:text-[#9AA6A0]"
            >
              {cooldown > 0 ? `Resend in ${String(cooldown)}s` : 'Send a new code'}
            </Button>
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

  if (step === 'signin') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
          Sign in{showSuffix}
        </h2>
        <p className="text-fa-muted mb-[26px] text-[15px] leading-[1.58]">
          {showName
            ? 'Use your rider account — you will come straight back to this show to finish your entry.'
            : 'Use your rider account to open your shows and entries.'}
        </p>

        <form
          noValidate
          onSubmit={(event) => {
            void signInForm.handleSubmit((values) => {
              setFormError(null);
              signIn.mutate(values, {
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
            error={signInErrors.email?.message}
            {...signInForm.register('email')}
          />

          <div className="mt-[22px]">
            <AuthPasswordField
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              error={signInErrors.password?.message}
              {...signInForm.register('password')}
            />
          </div>

          {formError && (
            <div className="mt-5">
              <AuthAlert tone="error">{formError}</AuthAlert>
            </div>
          )}

          <div className="mt-7">
            <AuthSubmit pending={signIn.isPending} pendingLabel="Signing in…">
              Sign in
            </AuthSubmit>
          </div>
        </form>

        <p className="text-fa-muted mt-6 text-[13.5px]">
          New to Field &amp; Arena?{' '}
          <Button
            type="button"
            variant="ghost"
            className={SWITCH_LINK_CLASSES}
            onClick={() => {
              switchStep('account');
            }}
          >
            Create an account
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
        Create your account{showSuffix}
      </h2>
      <p className="text-fa-muted mb-[26px] text-[15px] leading-[1.58]">
        {showName
          ? 'One login for every Field & Arena show. Once your email is confirmed you come straight back here to choose your classes.'
          : 'One login to enter classes at any Field & Arena show.'}
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
              <Button
                type="button"
                variant="ghost"
                className="h-auto rounded-none p-0 align-baseline font-bold text-inherit underline underline-offset-2 hover:bg-transparent"
                onClick={() => {
                  switchStep('signin');
                }}
              >
                Sign in instead
              </Button>
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

      <p className="text-fa-muted mt-6 text-[13.5px]">
        Already have a rider account?{' '}
        <Button
          type="button"
          variant="ghost"
          className={SWITCH_LINK_CLASSES}
          onClick={() => {
            switchStep('signin');
          }}
        >
          Sign in
        </Button>
      </p>
    </div>
  );
}
