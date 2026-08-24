import type { Metadata } from 'next';
import { listBookableShows } from '@/modules/vendors/data/queries';
import { SignupFlowPreview } from '@/modules/superadmin/ui/signup-flow-preview';

export const metadata: Metadata = { title: 'Signup Flow Preview — SuperAdmin Console' };

export default async function SignupFlowPreviewPage() {
  const bookableShows = await listBookableShows();
  const vendorShowId = bookableShows[0]?.showId ?? null;

  return <SignupFlowPreview vendorShowId={vendorShowId} />;
}
