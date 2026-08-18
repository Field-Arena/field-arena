'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { EMAIL_CODE_LENGTH } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import {
  AuthAlert,
  AuthCheckbox,
  AuthDivider,
  AuthEyebrow,
  AuthSubmit,
} from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { Button } from '@/shared/ui/shadcn/button';
import { loginSchema, type LoginInput } from '@/modules/auth/schemas';
import {
  useSignIn,
  useRequestPasswordReset,
  useSendSignInCode,
  useVerifySignInCode,
} from '@/modules/auth/hooks/use-auth-mutations';
import { isEmailAddress } from '@/modules/auth/utils/is-email-address';
import type { LoginView } from '@/modules/auth/types';
import { AuthPanel } from '@/modules/auth/ui/auth-panel';
import { AuthHeading } from '@/modules/auth/ui/auth-heading';
import { BackButton } from '@/modules/auth/ui/back-button';

/**
 * The sign-in panel, used both by the standalone /login route and by the
 * header dialog — see AuthShell's doc comment for why it renders in both
 * places.
 */
export function LoginForm({
  onSuccess,
  showFooter = true,
  headingLevel = 'h2',
}: {
  onSuccess?: () => void;
  /** The dialog renders its own footer bar, so it suppresses this one. */
  showFooter?: boolean;
  /** h1 on the standalone route, h2 inside the dialog where the page owns the h1. */
  headingLevel?: 'h1' | 'h2';
}) {
  const [view, setView] = useState<LoginView>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [code, setCode] = useState('');

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Ticked by default, as the design draws it.
    defaultValues: { email: '', password: '', remember: true },
  });

  const signIn = useSignIn({ onSuccess });
  const reset = useRequestPasswordReset();
  const sendCode = useSendSignInCode();
  const verifyCode = useVerifySignInCode({ onSuccess });

  // useWatch, not form.watch(): watch() returns a fresh function each render,
  // which the React Compiler cannot memoize.
  const email = useWatch({ control: form.control, name: 'email' });
  const remember = useWatch({ control: form.control, name: 'remember' }) ?? true;
  const { errors } = form.formState;

  const emailLabel = isEmailAddress(email) ? email : 'your account email';

  function show(next: LoginView) {
    setView(next);
    setFormError(null);
    setNotice(null);
    setResetSent(false);
  }

  if (view === 'forgot') {
    return (
      <AuthPanel centred>
        <AuthEyebrow centred>Reset</AuthEyebrow>
        <AuthHeading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Forgot password?
        </AuthHeading>
        <p className="mb-[26px] mt-2.5 max-w-[300px] text-[14.5px] leading-[1.56] text-fa-muted">
          We&apos;ll send a reset link to{' '}
          <strong className="font-semibold text-forest">{emailLabel}</strong>.
        </p>

        <AuthSubmit
          type="button"
          variant="forest"
          pending={reset.isPending}
          pendingLabel="Sending…"
          onClick={() => {
            if (!isEmailAddress(email)) {
              setFormError('Enter your account email first and we’ll send the link there.');
              return;
            }
            setFormError(null);
            reset.mutate(
              { email },
              {
                onSettled: () => {
                  setResetSent(true);
                  setNotice('Reset link sent. It expires in 30 minutes.');
                },
              },
            );
          }}
        >
          {resetSent ? 'Reset link sent' : 'Reset your password'}
        </AuthSubmit>

        <div className="mb-5 mt-6 w-full">
          <AuthDivider>Or, sign in with another method</AuthDivider>
        </div>

        <Button
          type="button"
          variant="ghost"
          disabled={sendCode.isPending}
          onClick={() => {
            if (!isEmailAddress(email)) {
              setFormError('Enter your account email first and we’ll send the code there.');
              return;
            }
            setFormError(null);
            sendCode.mutate(
              { email },
              {
                onSuccess: (outcome) => {
                  if (outcome.status === 'error') {
                    setFormError(outcome.message);
                    return;
                  }
                  setCode('');
                  setNotice('One-time code sent. Check your inbox.');
                  setView('code');
                },
                onError: (error) => {
                  setFormError(error.message);
                },
              },
            );
          }}
          className="h-auto w-full justify-start gap-3 rounded-xl border border-field bg-white px-4 py-3.5 text-left text-[14.5px] font-normal text-ink-deep transition-colors duration-150 ease-out hover:border-gold hover:bg-[#FEFCF5] disabled:opacity-70"
        >
          <MailIcon className="size-[17px] flex-none text-fa-muted" aria-hidden />
          <span>
            {isEmailAddress(email) ? `Email code to ${email}` : 'Email me a one-time code instead'}
          </span>
        </Button>

        {formError && (
          <div className="mt-[18px] w-full text-left">
            <AuthAlert tone="error">{formError}</AuthAlert>
          </div>
        )}
        {notice && !formError && (
          <div className="mt-[18px] w-full text-left">
            <AuthAlert tone="success">{notice}</AuthAlert>
          </div>
        )}

        <BackButton
          onClick={() => {
            show('login');
          }}
        />
      </AuthPanel>
    );
  }

  /** The prototype stops at "One-time code sent" — this panel is authored to give it somewhere to go. */
  if (view === 'code') {
    return (
      <AuthPanel centred>
        <AuthEyebrow centred>One-time code</AuthEyebrow>
        <AuthHeading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Check your inbox.
        </AuthHeading>
        <p className="mb-[26px] mt-2.5 max-w-[320px] text-[14.5px] leading-[1.56] text-fa-muted">
          We sent a {EMAIL_CODE_LENGTH}-digit code to{' '}
          <strong className="font-semibold text-forest">{emailLabel}</strong>.
        </p>

        <form
          className="w-full"
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);
            verifyCode.mutate(
              { email, token: code, remember },
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
          <EmailCodeInput value={code} onChange={setCode} disabled={verifyCode.isPending} />

          {formError && (
            <div className="mt-[18px] text-left">
              <AuthAlert tone="error">{formError}</AuthAlert>
            </div>
          )}

          <div className="mt-[26px]">
            <AuthSubmit variant="gold-flat" pending={verifyCode.isPending} pendingLabel="Signing in…">
              Sign in
            </AuthSubmit>
          </div>
        </form>

        <BackButton
          onClick={() => {
            show('forgot');
          }}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel>
      <AuthEyebrow>Log in</AuthEyebrow>
      <AuthHeading as={headingLevel} className="mt-[18px] text-[38px] leading-[1.02]">
        Welcome back.
      </AuthHeading>
      <p className="mb-7 mt-2.5 max-w-[330px] text-[15px] leading-[1.56] text-fa-muted">
        Organizer, staff, or rider — one login for Field &amp; Arena.
      </p>

      <form
        className="w-full"
        noValidate
        onSubmit={(event) => {
          // handleSubmit returns a promise; the DOM handler must return void.
          void form.handleSubmit((values) => {
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
          autoComplete="username"
          placeholder="you@yourbarn.com"
          error={errors.email?.message}
          {...form.register('email')}
        />

        <div className="mt-[22px]">
          <AuthPasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            error={errors.password?.message}
            action={
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  show('forgot');
                }}
                className="h-auto bg-transparent px-0 py-0 text-[12.5px] font-semibold text-fa-muted transition-colors hover:bg-transparent hover:text-gold"
              >
                Forgot password?
              </Button>
            }
            {...form.register('password')}
          />
        </div>

        <div className="mt-[18px]">
          <AuthCheckbox
            checked={remember}
            onChange={(next) => {
              form.setValue('remember', next);
            }}
          >
            Keep me signed in on this device
          </AuthCheckbox>
        </div>

        {formError && (
          <div className="mt-5">
            <AuthAlert tone="error">{formError}</AuthAlert>
          </div>
        )}

        <div className="mt-[26px]">
          <AuthSubmit variant="gold-flat" pending={signIn.isPending} pendingLabel="Signing in…">
            Log in
          </AuthSubmit>
        </div>

        {showFooter && (
          <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-6">
            <span className="text-[13.5px] text-fa-muted">New to Field &amp; Arena?</span>
            <Link
              href={ROUTES.signup}
              className="inline-flex items-center gap-2 text-[13.5px] font-bold text-forest transition-all duration-150 ease-out hover:gap-3 hover:text-gold"
            >
              Create an account
              <ArrowRightIcon className="size-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </form>
    </AuthPanel>
  );
}
