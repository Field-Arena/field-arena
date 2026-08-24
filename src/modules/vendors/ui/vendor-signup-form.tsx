'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthPasswordField } from '@/shared/ui/auth/auth-password-field';
import { AuthAlert } from '@/shared/ui/auth/auth-alert';
import { AuthEyebrow } from '@/shared/ui/auth/auth-eyebrow';
import { AuthSubmit } from '@/shared/ui/auth/auth-submit';
import { PasswordStrengthMeter } from '@/shared/ui/auth/password-strength-meter';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { readableError } from '@/shared/lib/error-message';
import { Button } from '@/shared/ui/shadcn/button';
import { vendorSignUpSchema, type VendorSignUpInput } from '@/modules/vendors/schemas';
import {
  useResendVendorSignUpCode,
  useSignUpVendor,
  useVerifyVendorSignUpCode,
} from '@/modules/vendors/hooks/use-vendor-auth-mutations';

export function VendorSignUpForm() {
  const [step, setStep] = useState<'account' | 'verify'>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const signUpForm = useForm<VendorSignUpInput>({
    resolver: zodResolver(vendorSignUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  const signUp = useSignUpVendor({
    onVerifyNeeded: (confirmedEmail) => {
      setAlreadyRegistered(false);
      setEmail(confirmedEmail);
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verify = useVerifyVendorSignUpCode();
  const resend = useResendVendorSignUpCode();
  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;

  if (step === 'verify') {
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
          <span className="text-forest text-sm font-medium">{email}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep('account');
              setCode('');
              verify.reset();
            }}
            className="border-line-mint-2 text-fa-muted hover:text-gold ml-0.5 h-auto rounded-none border-l bg-transparent px-0 py-0.5 pl-[11px] text-[12.5px] font-bold transition-colors hover:bg-transparent"
          >
            Change
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            verify.mutate({ email, token: code });
          }}
        >
          <div className="mb-[18px]">
            <EmailCodeInput value={code} onChange={setCode} disabled={verify.isPending} />
          </div>

          {verify.isError && (
            <div className="mb-[18px]">
              <AuthAlert tone="error">
                {readableError(verify.error, 'That code did not check out')}
              </AuthAlert>
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
              className="text-forest hover:text-gold h-auto rounded-none bg-transparent px-0 py-0 text-[13.5px] font-bold transition-colors hover:bg-transparent disabled:cursor-default disabled:text-[#9AA6A0] disabled:hover:text-[#9AA6A0]"
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
          setAlreadyRegistered(false);
          void signUpForm.handleSubmit((values) => {
            signUp.mutate(values);
          })(event);
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

        {alreadyRegistered ? (
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
          signUp.isError && (
            <div className="mt-5">
              <AuthAlert tone="error">
                {readableError(signUp.error, 'Could not create your account')}
              </AuthAlert>
            </div>
          )
        )}

        <div className="mt-7">
          <AuthSubmit pending={signUp.isPending} pendingLabel="Creating account…">
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
