'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { EMAIL_CODE_LENGTH } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import {
  AuthAlert,
  AuthEyebrow,
  AuthSubmit,
  PasswordStrengthMeter,
} from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { readableError } from '@/shared/lib/error-message';
import { Button } from '@/shared/ui/shadcn/button';
import { vendorSignUpSchema, type VendorSignUpInput } from '@/modules/vendors/schemas';
import { useVendorSignUpFlow } from '@/modules/vendors/hooks/use-vendor-signup-flow';

export function VendorSignUpForm() {
  const flow = useVendorSignUpFlow();

  const signUpForm = useForm<VendorSignUpInput>({
    resolver: zodResolver(vendorSignUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;

  if (flow.step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h1 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.08] font-medium tracking-[-.02em]">
          Verify your email
        </h1>
        <p className="text-fa-muted mb-[22px] text-[15px] leading-[1.58]">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address.
        </p>

        <div className="border-line-mint bg-mint mb-[26px] inline-flex items-center gap-2.5 rounded-[10px] border py-2.5 pr-3 pl-3.5">
          <MailIcon className="text-fa-muted size-[15px]" aria-hidden />
          <span className="text-forest text-sm font-medium">{flow.email}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={flow.backToAccount}
            className="border-line-mint-2 text-fa-muted hover:text-gold ml-0.5 h-auto rounded-none border-l bg-transparent px-0 py-0.5 pl-[11px] text-[12.5px] font-bold transition-colors hover:bg-transparent"
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
              disabled={flow.verify.isPending}
            />
          </div>

          {flow.verify.isError && (
            <div className="mb-[18px]">
              <AuthAlert tone="error">
                {readableError(flow.verify.error, 'That code did not check out')}
              </AuthAlert>
            </div>
          )}

          <div className="border-line flex items-center justify-between gap-4 border-b pb-[26px]">
            <span className="text-fa-muted text-[13.5px]">Didn&apos;t get it? Check spam, or</span>
            <Button
              type="button"
              variant="ghost"
              disabled={flow.cooldown > 0 || flow.resend.isPending}
              onClick={flow.resendCode}
              className="text-forest hover:text-gold h-auto rounded-none bg-transparent px-0 py-0 text-[13.5px] font-bold transition-colors hover:bg-transparent disabled:cursor-default disabled:text-[#9AA6A0] disabled:hover:text-[#9AA6A0]"
            >
              {flow.cooldown > 0 ? `Resend in ${String(flow.cooldown)}s` : 'Send a new code'}
            </Button>
          </div>

          <div className="mt-[26px]">
            <AuthSubmit pending={flow.verify.isPending} pendingLabel="Verifying…">
              Verify and continue
            </AuthSubmit>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <AuthEyebrow>Vendor account</AuthEyebrow>
      <h1 className="text-forest mt-3 mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.08] font-medium tracking-[-.02em]">
        Claim your vendor account
      </h1>
      <p className="text-fa-muted mb-[30px] text-[15px] leading-[1.58]">
        Create an account with the same email you applied with, and your applications show up here
        automatically — sign the booth agreement and pay once an organizer approves you.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void signUpForm.handleSubmit(flow.submitAccount)(event);
        }}
      >
        <div className="space-y-5">
          <AuthField
            label="Your name"
            autoComplete="name"
            placeholder="Jane Smith"
            error={errors.name?.message}
            {...signUpForm.register('name')}
          />
          <AuthField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...signUpForm.register('email')}
          />
          <div>
            <AuthPasswordField
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...signUpForm.register('password')}
            />
            <PasswordStrengthMeter password={password} />
          </div>
        </div>

        {flow.alreadyRegistered ? (
          <div className="mt-5">
            <AuthAlert tone="error">
              An account already exists for this email.{' '}
              <a href="/login" className="font-bold underline underline-offset-2">
                Sign in
              </a>{' '}
              instead.
            </AuthAlert>
          </div>
        ) : (
          flow.signUp.isError && (
            <div className="mt-5">
              <AuthAlert tone="error">
                {readableError(flow.signUp.error, 'Could not create your account')}
              </AuthAlert>
            </div>
          )
        )}

        <div className="mt-7">
          <AuthSubmit pending={flow.signUp.isPending} pendingLabel="Creating account…">
            Create account
          </AuthSubmit>
        </div>

        <p className="text-fa-muted-2 mt-[18px] text-center text-[12.5px]">
          Already have a vendor account?{' '}
          <a
            href="/login"
            className="border-gold text-forest hover:border-forest border-b font-semibold transition-colors"
          >
            Sign in
          </a>
          .
        </p>
      </form>
    </div>
  );
}
