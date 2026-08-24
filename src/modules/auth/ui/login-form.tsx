'use client';

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
import { useLoginViewState } from '@/modules/auth/hooks/use-login-view';
import { isEmailAddress } from '@/modules/auth/utils/is-email-address';
import {
  ENTER_EMAIL_FOR_RESET_MESSAGE,
  RESET_LINK_SENT_MESSAGE,
  ENTER_EMAIL_FOR_CODE_MESSAGE,
  CODE_SENT_MESSAGE,
} from '@/modules/auth/constants';
import { AuthPanel } from '@/modules/auth/ui/auth-panel';
import { AuthHeading } from '@/modules/auth/ui/auth-heading';
import { AuthBackButton } from '@/modules/auth/ui/back-button';

export function LoginForm({
  onSuccess,
  showFooter = true,
  headingLevel = 'h2',
}: {
  onSuccess?: () => void;

  showFooter?: boolean;

  headingLevel?: 'h1' | 'h2';
}) {
  const {
    view,
    setView,
    show,
    formError,
    setFormError,
    notice,
    setNotice,
    resetSent,
    setResetSent,
    code,
    setCode,
  } = useLoginViewState();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),

    defaultValues: { email: '', password: '', remember: true },
  });

  const signIn = useSignIn({ onSuccess });
  const reset = useRequestPasswordReset();
  const sendCode = useSendSignInCode();
  const verifyCode = useVerifySignInCode({ onSuccess });

  const email = useWatch({ control: form.control, name: 'email' });
  const remember = useWatch({ control: form.control, name: 'remember' }) ?? true;
  const { errors } = form.formState;

  const emailLabel = isEmailAddress(email) ? email : 'your account email';

  if (view === 'forgot') {
    return (
      <AuthPanel centred>
        <AuthEyebrow centred>Reset</AuthEyebrow>
        <AuthHeading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Forgot password?
        </AuthHeading>
        <p className="text-fa-muted mt-2.5 mb-[26px] max-w-[300px] text-[14.5px] leading-[1.56]">
          We&apos;ll send a reset link to{' '}
          <strong className="text-forest font-semibold">{emailLabel}</strong>.
        </p>

        <AuthSubmit
          type="button"
          variant="forest"
          pending={reset.isPending}
          pendingLabel="Sending…"
          onClick={() => {
            if (!isEmailAddress(email)) {
              setFormError(ENTER_EMAIL_FOR_RESET_MESSAGE);
              return;
            }
            setFormError(null);
            reset.mutate(
              { email },
              {
                onSettled: () => {
                  setResetSent(true);
                  setNotice(RESET_LINK_SENT_MESSAGE);
                },
              },
            );
          }}
        >
          {resetSent ? 'Reset link sent' : 'Reset your password'}
        </AuthSubmit>

        <div className="mt-6 mb-5 w-full">
          <AuthDivider>Or, sign in with another method</AuthDivider>
        </div>

        <Button
          type="button"
          variant="ghost"
          disabled={sendCode.isPending}
          onClick={() => {
            if (!isEmailAddress(email)) {
              setFormError(ENTER_EMAIL_FOR_CODE_MESSAGE);
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
                  setNotice(CODE_SENT_MESSAGE);
                  setView('code');
                },
                onError: (error) => {
                  setFormError(error.message);
                },
              },
            );
          }}
          className="border-field text-ink-deep hover:border-gold hover:text-ink-deep active:translate-y-0 h-auto w-full justify-start gap-3 rounded-xl border bg-white px-4 py-3.5 text-left text-[14.5px] font-normal whitespace-normal transition-colors duration-150 ease-out hover:bg-[#FEFCF5] disabled:opacity-70"
        >
          <MailIcon className="text-fa-muted size-[17px] flex-none" aria-hidden />
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

        <AuthBackButton
          onClick={() => {
            show('login');
          }}
        />
      </AuthPanel>
    );
  }

  if (view === 'code') {
    return (
      <AuthPanel centred>
        <AuthEyebrow centred>One-time code</AuthEyebrow>
        <AuthHeading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Check your inbox.
        </AuthHeading>
        <p className="text-fa-muted mt-2.5 mb-[26px] max-w-[320px] text-[14.5px] leading-[1.56]">
          We sent a {EMAIL_CODE_LENGTH}-digit code to{' '}
          <strong className="text-forest font-semibold">{emailLabel}</strong>.
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
            <AuthSubmit
              variant="gold-flat"
              pending={verifyCode.isPending}
              pendingLabel="Signing in…"
            >
              Sign in
            </AuthSubmit>
          </div>
        </form>

        <AuthBackButton
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
      <p className="text-fa-muted mt-2.5 mb-7 max-w-[330px] text-[15px] leading-[1.56]">
        Organizer, staff, or rider — one login for Field &amp; Arena.
      </p>

      <form
        className="w-full"
        noValidate
        onSubmit={(event) => {
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
                className="text-fa-muted hover:text-gold active:translate-y-0 h-auto bg-transparent px-0 py-0 text-[12.5px] font-semibold transition-colors hover:bg-transparent"
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
          <div className="border-line mt-7 flex items-center justify-between gap-4 border-t pt-6">
            <span className="text-fa-muted text-[13.5px]">New to Field &amp; Arena?</span>
            <Link
              href={ROUTES.signup}
              className="text-forest hover:text-gold inline-flex items-center gap-2 text-[13.5px] font-bold transition-all duration-150 ease-out hover:gap-3"
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
