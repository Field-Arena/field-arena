import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentRiderProfile, listRiderPortalShows } from '@/modules/riders/data/queries';
import { RIDER_RECENT_SHOWS_COOKIE } from '@/modules/riders/constants';
import { parseRecentShowIds } from '@/modules/riders/utils/recent-show-ids';
import { RiderAuthForm } from '@/modules/riders/ui/rider-auth-form';
import { RiderWelcomePanel } from '@/modules/riders/ui/rider-welcome-panel';

export const metadata: Metadata = { title: 'Rider Portal — Field & Arena' };

function safeNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith('/') || value.startsWith('//')) return undefined;
  return value;
}

export default async function RiderPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const rider = await getCurrentRiderProfile();
  const { next: rawNext, mode } = await searchParams;
  const next = safeNext(rawNext);

  // Already signed in but arrived via a show's "sign in to enter" link (e.g.
  // opened in a fresh tab where the session was still valid) — go straight
  // back to that show instead of stopping at the portal home.
  if (rider && next) redirect(next);

  if (!rider) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <RiderAuthForm returnTo={next} initialStep={mode === 'signin' ? 'signin' : 'account'} />
      </main>
    );
  }

  // The portal home lists every show the rider is tied to (entered, entry in
  // progress, or the show they came from) with a clear way back into each.
  const recentShowIds = parseRecentShowIds((await cookies()).get(RIDER_RECENT_SHOWS_COOKIE)?.value);
  const shows = await listRiderPortalShows(recentShowIds);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <RiderWelcomePanel rider={rider} shows={shows} />
    </main>
  );
}
