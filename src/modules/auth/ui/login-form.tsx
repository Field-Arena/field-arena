'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { loginSchema, type LoginInput } from '../schemas';
import { useSignIn, useRequestPasswordReset } from '../hooks/use-auth-mutations';
import { AuthField, AuthPasswordField } from './auth-field';
import { AuthAlert, AuthSubmit } from './auth-primitives';

/**
 * The sign-in form, deliberately container-agnostic.
 *
 * The legacy build had no /login route at all — Clerk's hosted widget was
 * mounted into a div on the marketing page, so signing in was an overlay. Clerk
 * supplied that UI; Supabase Auth is an API, so the form is ours either way, and
 * the only real question is where it renders. This component is therefore used
 * twice: by the /login route (which the proxy redirects to, and which invite
 * and password-reset links land on) and by the header dialog, which preserves
 * the overlay feel the app had before.
 */
export function LoginForm({
  onSuccess,
  showFooter = true,
}: {
  onSuccess?: () => void;
  /** The dialog renders its own footer bar, so it suppresses this one. */
  showFooter?: boolean;
}) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const [formError, setFormError] = useState<string | null>(null);
  const signIn = useSignIn({ onSuccess });
  const reset = useRequestPasswordReset();

  const { errors } = form.formState;

  return (
    <form
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
              disabled={reset.isPending}
              onClick={() => {
                // Reset needs only the email, so it reads the live field value
                // rather than making the user fill in a password first.
                reset.mutate({ email: form.getValues('email') });
              }}
              className="text-[12.5px] font-semibold text-fa-muted transition-colors hover:text-gold disabled:opacity-60"
            >
              Forgot password?
            </button>
          }
          {...form.register('password')}
        />
      </div>

      {formError && (
        <div className="mt-5">
          <AuthAlert tone="error">{formError}</AuthAlert>
        </div>
      )}

      <div className="mt-[26px]">
        <AuthSubmit pending={signIn.isPending} pendingLabel="Signing in…">
          Continue
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
  );
}
