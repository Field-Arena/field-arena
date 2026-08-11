'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2Icon } from 'lucide-react';
import { formatMoney } from '@/shared/lib/format/currency';
import { readableError } from '@/shared/lib/error-message';
import { ROUTES } from '@/shared/constants/routes';
import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthEyebrow, AuthSubmit } from '@/shared/ui/auth/auth-primitives';
import { useApplyToShowPublic } from '../hooks/use-vendor-apply-entry';
import type { PublicVendorApplyShow } from '../types';

/**
 * "I'm a Vendor" — the no-account entry point ported from legacy's
 * entry.html + vendor-apply.html, for app/vendor-apply/[showId]/page.tsx.
 * Legacy's version was a single anonymous POST with no account at all
 * (business/farm name, contact name, and email required; phone, website,
 * products, and special requests optional) — this is a faithful port of
 * that exact shape, not the account-creation flow this form used to combine
 * it with. See data/mutations.ts's applyToShowPublic + the RLS policies in
 * supabase/migrations/20260810120000_vendor_public_apply.sql for how a
 * genuinely anonymous submit is admitted.
 *
 * Built from the same design-system primitives auth's SignUpForm/LoginForm
 * use (shared/ui/auth/*, promoted there from the auth module specifically so
 * this could reuse them without reaching into another module's internals —
 * see .claude/rules/folder-structure.md), so a vendor with no account yet
 * still gets the same visual polish as the rest of the app's auth surfaces.
 *
 * A returning vendor isn't re-served this form — see the page itself for the
 * "already signed in" branch.
 */
export function VendorApplyEntryForm({ show }: { show: PublicVendorApplyShow }) {
  const [submitted, setSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const apply = useApplyToShowPublic();

  const cart = show.items
    .map((item) => ({ item, qty: qtyById[item.id] ?? 0 }))
    .filter(({ qty }) => qty > 0);

  if (submitted) {
    return (
      <div className="space-y-3 text-center [animation:fa-in_.22s_ease-out_both]">
        <CheckCircle2Icon className="mx-auto size-8 text-forest" aria-hidden />
        <h1 className="font-[family-name:var(--font-nr)] text-2xl font-medium text-forest">
          Application received
        </h1>
        <p className="text-[14.5px] leading-[1.58] text-fa-muted">
          {show.orgName} will review your application to vend at {show.showName} and follow up at{' '}
          <span className="font-medium text-ink-deep">{email}</span>.
        </p>
        <p className="text-[14.5px] leading-[1.58] text-fa-muted">
          Once approved, come back and{' '}
          <Link
            href="/vendor-apply/account"
            className="border-b border-gold font-semibold text-forest transition-colors hover:border-forest"
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
      <h1 className="mb-2.5 mt-3 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.08] tracking-[-.02em] text-forest">
        Apply to vend at {show.showName}
      </h1>
      <p className="mb-[30px] text-[15px] leading-[1.58] text-fa-muted">
        {show.orgName}
        {show.showDate && ` · ${show.showDate}`} — no account needed, submit your application below.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          apply.mutate(
            {
              showId: show.showId,
              businessName,
              contactName,
              email,
              phone: phone || undefined,
              website: website || undefined,
              productsOffered: productsOffered || undefined,
              specialRequests: specialRequests || undefined,
              items: cart.map(({ item, qty }) => ({ vendorItemId: item.id, qty })),
            },
            { onSuccess: () => { setSubmitted(true); } }
          );
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
            label="Contact name"
            required
            placeholder="Jane Smith"
            value={contactName}
            onChange={(e) => { setContactName(e.target.value); }}
          />
          <AuthField
            label="Email address"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); }}
          />
          <AuthField
            label="Phone (optional)"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); }}
          />
          <AuthField
            label="Website (optional)"
            placeholder="blueridgetack.com"
            value={website}
            onChange={(e) => { setWebsite(e.target.value); }}
          />
          <AuthField
            label="Products / services offered (optional)"
            placeholder="Tack, apparel, custom leatherwork"
            value={productsOffered}
            onChange={(e) => { setProductsOffered(e.target.value); }}
          />
          <AuthField
            label="Special requests (optional)"
            placeholder="Anything the organizer should know"
            value={specialRequests}
            onChange={(e) => { setSpecialRequests(e.target.value); }}
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

        {apply.isError && (
          <div className="mt-5">
            <AuthAlert tone="error">
              {readableError(apply.error, 'Could not submit your application')}
            </AuthAlert>
          </div>
        )}

        {cart.length === 0 && (
          <p className="mt-5 text-[13px] text-fa-muted">Select at least one booth space above to apply.</p>
        )}

        <div className="mt-7">
          <AuthSubmit
            pending={apply.isPending}
            pendingLabel="Submitting…"
            disabled={!businessName.trim() || !contactName.trim() || !email.trim() || cart.length === 0}
          >
            Submit application
          </AuthSubmit>
        </div>

        <p className="mt-[18px] text-center text-[12.5px] text-fa-muted-2">
          Already have a vendor account?{' '}
          <a href={ROUTES.login} className="border-b border-gold font-semibold text-forest transition-colors hover:border-forest">
            Sign in
          </a>{' '}
          to apply from your dashboard instead.
        </p>
      </form>
    </div>
  );
}
