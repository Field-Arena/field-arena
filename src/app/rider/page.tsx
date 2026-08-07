import type { Metadata } from 'next';
import { getCurrentRiderProfile } from '@/modules/riders/data/queries';
import { RiderAuthForm } from '@/modules/riders/ui/rider-auth-form';
import { RiderWelcomePanel } from '@/modules/riders/ui/rider-welcome-panel';

export const metadata: Metadata = { title: 'Rider Portal — Field & Arena' };

/**
 * The rider portal landing route — RIDER_WORKSPACE.href
 * (shared/constants/role-workspaces.ts) and where provisionedDestination
 * (auth/data/mutations.ts) sends a signed-in rider.
 *
 * Deliberately NOT in PROTECTED_PREFIXES (shared/constants/routes.ts): unlike
 * /dashboard, this route has to render something useful for a signed-out
 * visitor too — the self-service sign-up form — rather than bouncing them to
 * /login before they have ever had the chance to create an account here.
 */
export default async function RiderPortalPage() {
  const rider = await getCurrentRiderProfile();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      {rider ? <RiderWelcomePanel rider={rider} /> : <RiderAuthForm />}
    </main>
  );
}
