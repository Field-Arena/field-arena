'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import Link from 'next/link';
import { riderSignUpSchema, type RiderSignUpInput } from '@/modules/riders/schemas';
import { useRiderSignUpFlow } from '@/modules/riders/hooks/use-rider-signup-flow';
import { ROUTES } from '@/shared/constants/routes';
import { EMAIL_CODE_LENGTH } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { Button } from '@/shared/ui/shadcn/button';

export function RiderAuthForm() {
  const flow = useRiderSignUpFlow();

  const signUpForm = useForm<RiderSignUpInput>({
    resolver: zodResolver(riderSignUpSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;

  if (flow.step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
          Verify your email
        </h2>
        <p className="text-fa-muted mb-[22px] text-[15px] leading-[1.58]">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="border-line-mint bg-mint mb-[26px] inline-flex items-center gap-2.5 rounded-[10px] border py-2.5 pr-3 pl-3.5">
          <MailIcon className="text-fa-muted size-[15px]" aria-hidden />
          <span className="text-forest text-sm font-medium">{flow.email}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={flow.changeEmail}
            className="border-line-mint-2 text-fa-muted hover:text-gold ml-0.5 h-auto rounded-none border-l px-0 py-0.5 pl-[11px] text-[12.5px] font-bold transition-colors hover:bg-transparent"
          >
            Change
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            flow.submitVerify();
          }}
        >
          <div className="mb-[18px]">
            <EmailCodeInput
              value={flow.code}
              onChange={flow.setCode}
              disabled={flow.isVerifying}
            />
          </div>

          {flow.formError && (
            <div className="mb-[18px]">
              <AuthAlert tone="error">{flow.formError}</AuthAlert>
            </div>
          )}

          <div className="border-line flex items-center justify-between gap-4 border-b pb-[22px]">
            <span className="text-fa-muted text-[13.5px]">Didn&apos;t get it? Check spam, or</span>
            <Button
              type="button"
              variant="ghost"
              disabled={flow.cooldown > 0 || flow.isResending}
              onClick={flow.resendCode}
              className="text-forest hover:text-gold h-auto rounded-none px-0 py-0 text-[13.5px] font-bold transition-colors hover:bg-transparent disabled:cursor-default disabled:text-[#9AA6A0] disabled:opacity-100 disabled:hover:text-[#9AA6A0]"
            >
              {flow.cooldown > 0 ? `Resend in ${String(flow.cooldown)}s` : 'Send a new code'}
            </Button>
          </div>

          <div className="mt-[22px]">
            <AuthSubmit pending={flow.isVerifying} pendingLabel="Verifying…">
              Verify and continue
            </AuthSubmit>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
        Create your account
      </h2>
      <p className="text-fa-muted mb-[26px] text-[15px] leading-[1.58]">
        One login to enter classes at any Field &amp; Arena show.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void signUpForm.handleSubmit(flow.submitSignUp)(event);
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

        {flow.alreadyRegistered ? (
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
          flow.formError && (
            <div className="mt-5">
              <AuthAlert tone="error">{flow.formError}</AuthAlert>
            </div>
          )
        )}

        <div className="mt-7">
          <AuthSubmit pending={flow.isSigningUp} pendingLabel="Creating account…">
            Continue
          </AuthSubmit>
        </div>
      </form>
    </div>
  );
}
