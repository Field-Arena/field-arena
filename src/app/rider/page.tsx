import type { Metadata } from 'next';
import { getCurrentRiderProfile } from '@/modules/riders/data/queries';
import { RiderAuthForm } from '@/modules/riders/ui/rider-auth-form';
import { RiderWelcomePanel } from '@/modules/riders/ui/rider-welcome-panel';

export const metadata: Metadata = { title: 'Rider Portal — Field & Arena' };

export default async function RiderPortalPage() {
  const rider = await getCurrentRiderProfile();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      {rider ? <RiderWelcomePanel rider={rider} /> : <RiderAuthForm />}
    </main>
  );
}
