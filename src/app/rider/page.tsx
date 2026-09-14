import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentRiderProfile } from '@/modules/riders/data/queries';
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
  searchParams: Promise<{ next?: string }>;
}) {
  const rider = await getCurrentRiderProfile();
  const next = safeNext((await searchParams).next);

  // Already signed in but arrived via a show's "sign in to enter" link (e.g.
  // opened in a fresh tab where the session was still valid) — go straight
  // back to that show instead of stopping at the generic welcome screen.
  if (rider && next) redirect(next);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      {rider ? <RiderWelcomePanel rider={rider} /> : <RiderAuthForm returnTo={next} />}
    </main>
  );
}
