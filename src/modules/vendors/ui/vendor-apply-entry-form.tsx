'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { formatMoney } from '@/shared/lib/format/currency';
import { ROUTES } from '@/shared/constants/routes';
import { EMAIL_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/shared/constants/auth-code';
import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthEyebrow, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { EmailCodeInput } from '@/shared/ui/auth/email-code-input';
import { vendorSignUpSchema, vendorVerifySchema, type VendorSignUpInput, type VendorVerifyInput } from '../schemas';
import {
  useResendVendorApplyCode,
  useSignUpAndApplyAsVendor,
  useVerifyAndApplyAsVendor,
} from '../hooks/use-vendor-apply-entry';
import type { PublicVendorApplyShow } from '../types';

/**
 * "I'm a Vendor" — the no-prior-account entry point ported from legacy's
 * entry.html + vendor-apply.html, for app/vendor-apply/[showId]/page.tsx.
 * legacy's version was a single anonymous POST (no account at all); this
 * port's real-auth model (see data/mutations.ts's signUpVendor doc comment)
 * means the account has to exist before applyToVendorShow's RLS-governed
 * insert can run, so this combines both steps into one visible submit — see
 * hooks/use-vendor-apply-entry.ts for why that combining lives in a hook and
 * not here (ui/ must never import from data/, .claude/rules/layers.md).
 *
 * Built from the same design-system primitives auth's SignUpForm/LoginForm
 * use (shared/ui/auth/*, promoted there from the auth module specifically so
 * this could reuse them without reaching into another module's internals —
 * see .claude/rules/folder-structure.md) — same OTP boxes, resend cooldown,
 * password strength meter, and card treatment as the sign-up dialog, so a
 * vendor with no account yet gets the same polish a rider or staff member
 * signing up already does, not a second, plainer-looking form.
 *
 * A returning vendor isn't re-served this form — see the page itself for the
 * "already signed in" branch — so this only ever needs the create-account
 * shape, not sign-in.
 */
export function VendorApplyEntryForm({ show }: { show: PublicVendorApplyShow }) {
  const [step, setStep] = useState<'account' | 'verify'>('account');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const signUpForm = useForm<VendorSignUpInput>({
    resolver: zodResolver(vendorSignUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const verifyForm = useForm<VendorVerifyInput>({
    resolver: zodResolver(vendorVerifySchema),
    defaultValues: { email: '', token: '' },
  });
  const password = useWatch({ control: signUpForm.control, name: 'password' });
  const { errors } = signUpForm.formState;

  // Same resend-cooldown timer as SignUpForm, cleared on unmount so a vendor
  // who navigates away mid-count doesn't leave an interval running against a
  // dead component.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  const cart = show.items
    .map((item) => ({ item, qty: qtyById[item.id] ?? 0 }))
    .filter(({ qty }) => qty > 0);

  const application = {
    showId: show.showId,
    businessName,
    productsOffered: productsOffered || undefined,
    items: cart.map(({ item, qty }) => ({ vendorItemId: item.id, qty })),
  };

  const accountStep = useSignUpAndApplyAsVendor({
    onVerifyNeeded: (confirmedEmail) => {
      setAlreadyRegistered(false);
      setEmail(confirmedEmail);
      verifyForm.setValue('email', confirmedEmail);
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onAlreadyRegistered: () => {
      setAlreadyRegistered(true);
    },
  });
  const verifyStep = useVerifyAndApplyAsVendor();
  const resend = useResendVendorApplyCode();

  if (step === 'verify') {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both]">
        <h1 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.08] tracking-[-.02em] text-forest">
          Verify your email
        </h1>
        <p className="mb-[22px] text-[15px] leading-[1.58] text-fa-muted">
          We sent a {EMAIL_CODE_LENGTH}-digit code to confirm this address. Your application for{' '}
          {show.showName} submits right after.
        </p>

        <div className="mb-[26px] inline-flex items-center gap-2.5 rounded-[10px] border border-line-mint bg-mint py-2.5 pl-3.5 pr-3">
          <MailIcon className="size-[15px] text-fa-muted" aria-hidden />
          <span className="text-sm font-medium text-forest">{email}</span>
          <button
            type="button"
            onClick={() => {
              setStep('account');
              setCode('');
            }}
            className="ml-0.5 border-l border-line-mint-2 py-0.5 pl-[11px] text-[12.5px] font-bold text-fa-muted transition-colors hover:text-gold"
          >
            Change
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verifyForm.handleSubmit(() => {
              verifyStep.mutate({ verify: { email, token: code }, application });
            })(event);
          }}
        >
          <div className="mb-[18px]">
            <EmailCodeInput value={code} onChange={setCode} disabled={verifyStep.isPending} />
          </div>

          {verifyStep.isError && (
            <div className="mb-[18px]">
              <AuthAlert tone="error">
                {verifyStep.error instanceof Error ? verifyStep.error.message : 'That code did not check out'}
              </AuthAlert>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-b border-line pb-[26px]">
            <span className="text-[13.5px] text-fa-muted">Didn&apos;t get it? Check spam, or</span>
            <button
              type="button"
              disabled={cooldown > 0 || resend.isPending}
              onClick={() => {
                resend.mutate({ email }, { onSuccess: () => { setCooldown(RESEND_COOLDOWN_SECONDS); } });
              }}
              className="text-[13.5px] font-bold text-forest transition-colors hover:text-gold disabled:cursor-default disabled:text-[#9AA6A0] disabled:hover:text-[#9AA6A0]"
            >
              {cooldown > 0 ? `Resend in ${String(cooldown)}s` : 'Send a new code'}
            </button>
          </div>

          <div className="mt-[26px]">
            <AuthSubmit pending={verifyStep.isPending} pendingLabel="Verifying…">
              Verify and submit
            </AuthSubmit>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <AuthEyebrow>Vendor application</AuthEyebrow>
      <h1 className="mb-2.5 mt-3 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.08] tracking-[-.02em] text-forest">
        Apply to vend at {show.showName}
      </h1>
      <p className="mb-[30px] text-[15px] leading-[1.58] text-fa-muted">
        {show.orgName}
        {show.showDate && ` · ${show.showDate}`} — no prior account needed, create one and submit in
        one step.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setAlreadyRegistered(false);
          void signUpForm.handleSubmit((values) => {
            accountStep.mutate({ signUp: values, application });
          })(event);
        }}
      >
        <div className="space-y-5 border-b border-line pb-6">
          <AuthField
            label="Business / farm name"
            required
            placeholder="Blue Ridge Tack Co."
            value={businessName}
            onChange={(e) => { setBusinessName(e.target.value); }}
          />
          <AuthField
            label="Products / services offered (optional)"
            placeholder="Tack, apparel, custom leatherwork"
            value={productsOffered}
            onChange={(e) => { setProductsOffered(e.target.value); }}
          />

          <div>
            <p className="mb-[9px] text-xs font-bold uppercase tracking-[.1em] text-forest">
              Booth space
            </p>
            <div className="space-y-2.5">
              {show.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-field bg-white px-4 py-3"
                >
                  <span className="min-w-0 flex-1 text-[14px] text-ink-deep">
                    {item.name}
                    <span className="ml-2 text-fa-muted">{formatMoney(item.price)}</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={item.remaining ?? undefined}
                    className="h-auto w-16 rounded-lg border border-field bg-white px-2 py-1.5 text-center text-[14px] text-ink-deep outline-none focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]"
                    value={qtyById[item.id] ?? 0}
                    onChange={(e) => {
                      const n = Math.max(0, Number(e.target.value) || 0);
                      setQtyById((prev) => ({ ...prev, [item.id]: n }));
                    }}
                    aria-label={`Quantity for ${item.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 pt-6">
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
              <a href={ROUTES.login} className="font-bold underline underline-offset-2">
                Sign in
              </a>{' '}
              first, then apply from Reserve Space in your vendor dashboard.
            </AuthAlert>
          </div>
        ) : (
          accountStep.isError && (
            <div className="mt-5">
              <AuthAlert tone="error">
                {accountStep.error instanceof Error
                  ? accountStep.error.message
                  : 'Could not create your account'}
              </AuthAlert>
            </div>
          )
        )}

        {cart.length === 0 && (
          <p className="mt-5 text-[13px] text-fa-muted">Select at least one booth space above to apply.</p>
        )}

        <div className="mt-7">
          <AuthSubmit
            pending={accountStep.isPending}
            pendingLabel="Submitting…"
            disabled={!businessName.trim() || cart.length === 0}
          >
            Create account &amp; apply
          </AuthSubmit>
        </div>

        <p className="mt-[18px] text-center text-[12.5px] text-fa-muted-2">
          Already have a vendor account?{' '}
          <a href={ROUTES.login} className="border-b border-gold font-semibold text-forest transition-colors hover:border-forest">
            Sign in
          </a>{' '}
          instead.
        </p>
      </form>
    </div>
  );
}
