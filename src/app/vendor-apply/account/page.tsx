import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { VendorSignUpForm } from '@/modules/vendors/ui/vendor-signup-form';

export const metadata: Metadata = { title: 'Claim your vendor account — Field & Arena' };

export default async function VendorClaimAccountPage() {
  const profile = await getStaffProfile();

  return (
    <div className="fa-public bg-cream flex min-h-dvh items-center justify-center px-4 py-12 font-[family-name:var(--font-ar)]">
      <div className="border-line bg-paper w-full max-w-[452px] rounded-[18px] border px-9 pt-9 pb-[30px] shadow-[0_40px_90px_rgba(9,26,21,.45)]">
        {profile ? (
          <div className="space-y-3 text-center">
            <h2 className="text-forest font-[family-name:var(--font-nr)] text-xl font-medium">
              You&apos;re already signed in
            </h2>
            <p className="text-fa-muted text-[14.5px] leading-[1.58]">
              Signed in as <span className="text-ink-deep font-medium">{profile.name}</span>.{' '}
              {profile.platform_role === 'Vendor'
                ? 'Your applications and bookings are in your dashboard.'
                : "This account isn't a vendor account, so it won't see any vendor applications."}
            </p>
            <Link
              href={
                profile.platform_role === 'Vendor' ? `${ROUTES.dashboard}/vendor` : ROUTES.dashboard
              }
              className="text-forest hover:text-gold inline-block font-semibold underline underline-offset-2"
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
