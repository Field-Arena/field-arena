import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isUuid } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getPublicVendorApplyShow } from '@/modules/vendors/data/queries';
import { VendorApplyEntryForm } from '@/modules/vendors/ui/vendor-apply-entry-form';

export const metadata: Metadata = { title: 'Apply to vend — Field & Arena' };

/**
 * The public, no-login-needed vendor application entry point — ported from
 * legacy's entry.html ("I'm a Vendor" branch) + vendor-apply.html
 * (api/shows/[id]/[resource].js's handleVendorApply), which this port never
 * carried over: the new Discover Shows / Apply flow
 * (dashboard/vendor/discover) only ever worked for someone already signed in
 * as a platform Vendor, with no way to become one short of a direct database
 * write. This is the missing front door — an organizer shares
 * /vendor-apply/{showId} the same way they'd have shared vendor-apply.html's
 * link before.
 *
 * Deliberately outside the (dashboard) route group and PROTECTED_PREFIXES
 * (shared/constants/routes.ts) — like /rider, this has to stay browsable
 * with no session at all.
 */
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
    <div className="fa-public flex min-h-dvh items-center justify-center bg-cream px-4 py-12 font-[family-name:var(--font-ar)]">
      {/* Same card treatment as the sign-in overlay (auth/ui/login-dialog.tsx)
          — rounded-18px, paper background, the same soft deep shadow — so a
          vendor with no account yet lands somewhere that looks like the rest
          of this app's auth surface, not a plainer one-off page. */}
      <div className="w-full max-w-[452px] rounded-[18px] border border-line bg-paper px-9 pb-[30px] pt-9 shadow-[0_40px_90px_rgba(9,26,21,.45)]">
        {show.items.length === 0 ? (
          <div className="space-y-2 text-center">
            <h2 className="font-[family-name:var(--font-nr)] text-xl font-medium text-forest">
              Not accepting applications yet
            </h2>
            <p className="text-[14.5px] leading-[1.58] text-fa-muted">
              {show.showName} isn&apos;t open for vendor applications right now — check back soon, or
              contact {show.orgName} directly.
            </p>
          </div>
        ) : alreadyVendor ? (
          <div className="space-y-3 text-center">
            <h2 className="font-[family-name:var(--font-nr)] text-xl font-medium text-forest">
              You&apos;re already signed in
            </h2>
            <p className="text-[14.5px] leading-[1.58] text-fa-muted">
              Signed in as <span className="font-medium text-ink-deep">{profile.name}</span>. Apply
              to {show.showName} from Reserve Space in your vendor dashboard — this show is already
              listed there.
            </p>
            <Link
              href={`${ROUTES.dashboard}/vendor/discover`}
              className="inline-block font-semibold text-forest underline underline-offset-2 hover:text-gold"
            >
              Go to Reserve Space →
            </Link>
          </div>
        ) : (
          <VendorApplyEntryForm show={show} />
        )}
      </div>
    </div>
  );
}
