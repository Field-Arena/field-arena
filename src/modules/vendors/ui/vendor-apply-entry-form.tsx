'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon } from 'lucide-react';
import { formatMoney } from '@/shared/lib/format/currency';
import { readableError } from '@/shared/lib/error-message';
import { ROUTES } from '@/shared/constants/routes';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthEyebrow, AuthSubmit } from '@/shared/ui/auth/auth-primitives';
import { Input } from '@/shared/ui/shadcn/input';
import { withSanitizer } from '@/shared/lib/format/input-sanitize';
import { PHONE_INPUT_PROPS, sanitizePhoneInput } from '@/shared/lib/format/phone-input';
import { EMAIL_INPUT_PROPS } from '@/shared/lib/format/email-input';
import { URL_INPUT_PROPS } from '@/shared/lib/format/url-input';
import { blockNonIntegerKeys } from '@/shared/lib/format/number-input';
import { useApplyToShowPublic } from '@/modules/vendors/hooks/use-vendor-apply-entry';
import { VENDOR_ITEM_QTY_MAX } from '@/modules/vendors/constants';
import {
  applyToShowPublicFormSchema,
  type ApplyToShowPublicFormInput,
  type ApplyToShowPublicFormValues,
} from '@/modules/vendors/schemas';
import type { PublicVendorApplyShow } from '@/modules/vendors/types';

export function VendorApplyEntryForm({ show }: { show: PublicVendorApplyShow }) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const form = useForm<ApplyToShowPublicFormInput, unknown, ApplyToShowPublicFormValues>({
    resolver: zodResolver(applyToShowPublicFormSchema),
    mode: 'onTouched',
    defaultValues: {
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      productsOffered: '',
      specialRequests: '',
    },
  });
  const { errors } = form.formState;
  const [businessName, contactName, email] = useWatch({
    control: form.control,
    name: ['businessName', 'contactName', 'email'],
  });
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const apply = useApplyToShowPublic();

  const cart = show.items
    .map((item) => ({ item, qty: qtyById[item.id] ?? 0 }))
    .filter(({ qty }) => qty > 0);

  if (submittedEmail !== null) {
    return (
      <div className="[animation:fa-in_.22s_ease-out_both] space-y-3 text-center">
        <CheckCircle2Icon className="text-forest mx-auto size-8" aria-hidden />
        <h1 className="text-forest font-[family-name:var(--font-nr)] text-2xl font-medium">
          Application received
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.58]">
          {show.orgName} will review your application to vend at {show.showName} and follow up at{' '}
          <span className="text-ink-deep font-medium">{submittedEmail}</span>.
        </p>
        <p className="text-fa-muted text-[14.5px] leading-[1.58]">
          Once approved, come back and{' '}
          <Link
            href="/vendor-apply/account"
            prefetch={false}
            className="border-gold text-forest hover:border-forest border-b font-semibold transition-colors"
          >
            claim your vendor account
          </Link>{' '}
          with this same email to sign the booth agreement and pay.
        </p>
      </div>
    );
  }

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <AuthEyebrow>Vendor application</AuthEyebrow>
      <h1 className="text-forest mt-3 mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.08] font-medium tracking-[-.02em]">
        Apply to vend at {show.showName}
      </h1>
      <p className="text-fa-muted mb-[30px] text-[15px] leading-[1.58]">
        {show.orgName}
        {show.showDate && ` · ${show.showDate}`} — no account needed, submit your application below.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit((values) => {
            apply.mutate(
              {
                ...values,
                showId: show.showId,
                items: cart.map(({ item, qty }) => ({ vendorItemId: item.id, qty })),
              },
              {
                onSuccess: () => {
                  setSubmittedEmail(values.email);
                },
              },
            );
          })(event);
        }}
      >
        <div className="border-line space-y-5 border-b pb-6">
          <AuthField
            label="Business / farm name"
            required
            placeholder="Blue Ridge Tack Co."
            autoComplete="organization"
            maxLength={300}
            error={errors.businessName?.message}
            {...form.register('businessName')}
          />
          <AuthField
            label="Contact name"
            required
            placeholder="Jane Smith"
            autoComplete="name"
            maxLength={200}
            error={errors.contactName?.message}
            {...form.register('contactName')}
          />
          <AuthField
            label="Email address"
            {...EMAIL_INPUT_PROPS}
            required
            placeholder="you@example.com"
            error={errors.email?.message}
            {...form.register('email')}
          />
          <AuthField
            label="Phone (optional)"
            {...PHONE_INPUT_PROPS}
            placeholder="(555) 123-4567"
            error={errors.phone?.message}
            {...withSanitizer(form.register('phone'), sanitizePhoneInput)}
          />
          <AuthField
            label="Website (optional)"
            {...URL_INPUT_PROPS}
            placeholder="blueridgetack.com"
            error={errors.website?.message}
            {...form.register('website')}
          />
          <AuthField
            label="Products / services offered (optional)"
            placeholder="Tack, apparel, custom leatherwork"
            maxLength={500}
            error={errors.productsOffered?.message}
            {...form.register('productsOffered')}
          />
          <AuthField
            label="Special requests (optional)"
            placeholder="Anything the organizer should know"
            maxLength={500}
            error={errors.specialRequests?.message}
            {...form.register('specialRequests')}
          />

          <div>
            <p className="text-forest mb-[9px] text-xs font-bold tracking-[.1em] uppercase">
              Booth space
            </p>
            <div className="space-y-2.5">
              {show.items.map((item) => (
                <div
                  key={item.id}
                  className="border-field flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3"
                >
                  <span className="text-ink-deep min-w-0 flex-1 text-[14px]">
                    {item.name}
                    <span className="text-fa-muted ml-2">{formatMoney(item.price)}</span>
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={item.remaining ?? VENDOR_ITEM_QTY_MAX}
                    step={1}
                    onKeyDown={blockNonIntegerKeys}
                    className="border-field text-ink-deep focus-visible:border-gold focus-visible:ring-gold/[.16] h-auto w-16 rounded-lg border bg-white px-2 py-1.5 text-center text-[14px] outline-none focus-visible:ring-[3px]"
                    value={qtyById[item.id] ?? 0}
                    onChange={(e) => {
                      const n = Math.min(
                        item.remaining ?? VENDOR_ITEM_QTY_MAX,
                        Math.max(0, Math.trunc(Number(e.target.value)) || 0),
                      );
                      setQtyById((prev) => ({ ...prev, [item.id]: n }));
                    }}
                    aria-label={`Quantity for ${item.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {apply.isError && (
          <div className="mt-5">
            <AuthAlert tone="error">
              {readableError(apply.error, 'Could not submit your application')}
            </AuthAlert>
          </div>
        )}

        {cart.length === 0 && (
          <p className="text-fa-muted mt-5 text-[13px]">
            Select at least one booth space above to apply.
          </p>
        )}

        <div className="mt-7">
          <AuthSubmit
            pending={apply.isPending}
            pendingLabel="Submitting…"
            disabled={
              !businessName.trim() || !contactName.trim() || !email.trim() || cart.length === 0
            }
          >
            Submit application
          </AuthSubmit>
        </div>

        <p className="text-fa-muted-2 mt-[18px] text-center text-[12.5px]">
          Already have a vendor account?{' '}
          <a
            href={ROUTES.login}
            className="border-gold text-forest hover:border-forest border-b font-semibold transition-colors"
          >
            Sign in
          </a>{' '}
          to apply from your dashboard instead.
        </p>
      </form>
    </div>
  );
}
