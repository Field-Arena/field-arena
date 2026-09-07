import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isUuid } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getPublicVendorApplyShow } from '@/modules/vendors/data/queries';
import { VendorApplyEntryForm } from '@/modules/vendors/ui/vendor-apply-entry-form';

export const metadata: Metadata = { title: 'Apply to vend — Field & Arena' };

export default async function VendorPublicApplyPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  if (!isUuid(showId)) notFound();

  const show = await getPublicVendorApplyShow(showId);
  if (!show) notFound();

  const profile = await getStaffProfile();
  const alreadyVendor = profile?.platform_role === 'Vendor';

  return (
    <div className="fa-public bg-cream flex min-h-dvh items-center justify-center px-4 py-12 font-[family-name:var(--font-ar)]">
      <div className="border-line bg-paper w-full max-w-[452px] rounded-[18px] border px-9 pt-9 pb-[30px] shadow-[0_40px_90px_rgba(9,26,21,.45)]">
        {show.items.length === 0 ? (
          <div className="space-y-2 text-center">
            <h2 className="text-forest font-[family-name:var(--font-nr)] text-xl font-medium">
              Not accepting applications yet
            </h2>
            <p className="text-fa-muted text-[14.5px] leading-[1.58]">
              {show.showName} isn&apos;t open for vendor applications right now — check back soon,
              or contact {show.orgName} directly.
            </p>
          </div>
        ) : alreadyVendor ? (
          <div className="space-y-3 text-center">
            <h2 className="text-forest font-[family-name:var(--font-nr)] text-xl font-medium">
              You&apos;re already signed in
            </h2>
            <p className="text-fa-muted text-[14.5px] leading-[1.58]">
              Signed in as <span className="text-ink-deep font-medium">{profile.name}</span>. Apply
              to {show.showName} from Reserve Space in your vendor dashboard — this show is already
              listed there.
            </p>
            <Link
              href={`${ROUTES.dashboard}/vendor/discover`}
              className="text-forest hover:text-gold inline-block font-semibold underline underline-offset-2"
            >
              Go to Reserve Space →
            </Link>
          </div>
        ) : (
          <>
            {/* Legacy's apply page linked the booth map right above the cart
              * (vendor-apply.html:107-110) — you pick a space knowing where it
              * sits, not from a name alone. */}
            {show.vendorMapUrl && (
              <p className="mb-3 text-[13.5px]">
                <a
                  href={show.vendorMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest hover:text-gold font-semibold underline underline-offset-2"
                >
                  View the vendor space map ↗
                </a>
              </p>
            )}
            <VendorApplyEntryForm show={show} />
          </>
        )}
      </div>
    </div>
  );
}
