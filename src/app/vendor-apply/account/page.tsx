import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { VendorSignUpForm } from '@/modules/vendors/ui/vendor-signup-form';

export const metadata: Metadata = { title: 'Claim your vendor account — Field & Arena' };

/**
 * The bridge legacy's vendor.html provided for free by mounting Clerk's
 * SignUp widget directly on the page for an unauthenticated visitor
 * (public/views/vendor.html — see mountVendorSignIn/clerk.mountSignUp).
 * applyToShowPublic (data/mutations.ts) is genuinely anonymous — no account,
 * on purpose, to match legacy's real vendor-apply.html POST — so without
 * this page, an approved applicant has no way to ever reach
 * signVendorAgreement/createVendorCheckoutSession, both of which require a
 * real Vendor account. Signing up here with the same email the application
 * used is all it takes: vendor_bookings_select_own/update_own
 * (20260806140000_vendor_self_service.sql) reconcile by contact email, not a
 * stored link.
 *
 * Deliberately outside (dashboard)/PROTECTED_PREFIXES (shared/constants/routes.ts)
 * — like /vendor-apply/[showId] and /rider, this has to stay browsable with
 * no session at all; the dashboard layout itself redirects anyone with no
 * profile straight to /login, which would make this page unreachable if it
 * lived there.
 */
export default async function VendorClaimAccountPage() {
  const profile = await getStaffProfile();

  return (
    <div className="fa-public flex min-h-dvh items-center justify-center bg-cream px-4 py-12 font-[family-name:var(--font-ar)]">
      <div className="w-full max-w-[452px] rounded-[18px] border border-line bg-paper px-9 pb-[30px] pt-9 shadow-[0_40px_90px_rgba(9,26,21,.45)]">
        {profile ? (
          <div className="space-y-3 text-center">
            <h2 className="font-[family-name:var(--font-nr)] text-xl font-medium text-forest">
              You&apos;re already signed in
            </h2>
            <p className="text-[14.5px] leading-[1.58] text-fa-muted">
              Signed in as <span className="font-medium text-ink-deep">{profile.name}</span>.{' '}
              {profile.platform_role === 'Vendor'
                ? 'Your applications and bookings are in your dashboard.'
                : "This account isn't a vendor account, so it won't see any vendor applications."}
            </p>
            <Link
              href={
                profile.platform_role === 'Vendor'
                  ? `${ROUTES.dashboard}/vendor`
                  : ROUTES.dashboard
              }
              className="inline-block font-semibold text-forest underline underline-offset-2 hover:text-gold"
            >
              Go to your dashboard →
            </Link>
          </div>
        ) : (
          <VendorSignUpForm />
        )}
      </div>
    </div>
  );
}
