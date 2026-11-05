import type { Metadata } from 'next';
import { RiderDemoWalkthrough } from '@/modules/riders/ui/rider-demo-walkthrough';
import { getStaffProfile } from '@/shared/lib/auth/session';

export const metadata: Metadata = { title: 'Rider Signup Demo — Field & Arena' };

export default async function RiderDemoPage() {
  const profile = await getStaffProfile();
  const isSuperAdmin = profile?.platform_role === 'SuperAdmin';
  return <RiderDemoWalkthrough showBackToConsole={isSuperAdmin} />;
}
