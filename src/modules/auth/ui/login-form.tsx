'use client';

import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/lib/utils';
import { loginSchema, type LoginInput } from '../schemas';
import {
  useSignIn,
  useRequestPasswordReset,
  useSendSignInCode,
  useVerifySignInCode,
} from '../hooks/use-auth-mutations';
import { EMAIL_CODE_LENGTH } from '@/shared/constants/auth-code';
import { isEmailAddress } from '../utils';
import type { LoginView } from '../types';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import {
  AuthAlert,
  AuthCheckbox,
  AuthDivider,
  AuthEyebrow,
  AuthSubmit,
} from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';

/**
 * The sign-in panel, deliberately container-agnostic.
 *
 * The legacy build had no /login route at all — Clerk's hosted widget was
 * mounted into a div on the marketing page, so signing in was an overlay. Clerk
 * supplied that UI; Supabase Auth is an API, so the form is ours either way, and
 * the only real question is where it renders. This component is therefore used
 * twice: by the /login route (which the proxy redirects to, and which invite
 * and password-reset links land on) and by the header dialog, which preserves
 * the overlay feel the app had before.
 *
 * It owns its own heading block because the design swaps the whole panel — the
 * eyebrow, heading, and lead all change between signing in and resetting — so a
 * container that drew a fixed header could not follow it.
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
  // which the React Compiler cannot memoize, so it bails out of optimising this
  // whole component.
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
      <Panel centred>
        <AuthEyebrow centred>Reset</AuthEyebrow>
        <Heading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Forgot password?
        </Heading>
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
              }
            );
          }}
        >
          {resetSent ? 'Reset link sent' : 'Reset your password'}
        </AuthSubmit>

        <div className="mb-5 mt-6 w-full">
          <AuthDivider>Or, sign in with another method</AuthDivider>
        </div>

        <button
          type="button"
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
              }
            );
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-field bg-white px-4 py-3.5 text-left text-[14.5px] text-ink-deep transition-colors duration-150 ease-out hover:border-gold hover:bg-[#FEFCF5] disabled:opacity-70"
        >
          <MailIcon className="size-[17px] flex-none text-fa-muted" aria-hidden />
          <span>
            {isEmailAddress(email)
              ? `Email code to ${email}`
              : 'Email me a one-time code instead'}
          </span>
        </button>

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
      </Panel>
    );
  }

  /**
   * Entering the emailed code. The design's prototype stops at "One-time code
   * sent", which would hand someone a code and no box to type it into — so this
   * panel is authored, reusing the sign-up flow's code entry.
   */
  if (view === 'code') {
    return (
      <Panel centred>
        <AuthEyebrow centred>One-time code</AuthEyebrow>
        <Heading as={headingLevel} className="mt-4 text-[34px] leading-[1.04]">
          Check your inbox.
        </Heading>
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
              }
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

        <BackButton
          onClick={() => {
            show('forgot');
          }}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <AuthEyebrow>Log in</AuthEyebrow>
      <Heading as={headingLevel} className="mt-[18px] text-[38px] leading-[1.02]">
        Welcome back.
      </Heading>
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
              <button
                type="button"
                onClick={() => {
                  show('forgot');
                }}
                className="text-[12.5px] font-semibold text-fa-muted transition-colors hover:text-gold"
              >
                Forgot password?
              </button>
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
    </Panel>
  );
}

/** Each view fades in on its own, so switching panels reads as a step, not a jump. */
function Panel({ children, centred }: { children: ReactNode; centred?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col [animation:fa-in_.22s_ease-out_both]',
        centred && 'items-center text-center'
      )}
    >
      {children}
    </div>
  );
}

function Heading({
  as,
  className,
  children,
}: {
  as: 'h1' | 'h2';
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'font-[family-name:var(--font-nr)] font-medium tracking-[-.024em] text-forest',
        className
      )}
    >
      {children}
    </Tag>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-[22px] px-2 py-1 text-[13.5px] font-semibold text-fa-muted transition-colors hover:text-gold"
    >
      Back
    </button>
  );
}
