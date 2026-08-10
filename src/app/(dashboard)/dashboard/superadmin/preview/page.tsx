import type { Metadata } from 'next';
import { listBookableShows } from '@/modules/vendors/data/queries';
import { SignupFlowPreview } from '@/modules/superadmin/ui/signup-flow-preview';

export const metadata: Metadata = { title: 'Signup Flow Preview — SuperAdmin Console' };

/**
 * The restored "Signup Flow Preview" button (src/modules/superadmin/constants.ts's
 * SUPERADMIN_TOOLS) — see signup-flow-preview.tsx for what this renders.
 * Only reads a real published show with open vendor spaces here (via the
 * existing listBookableShows query, already public/anonymous-safe — no new
 * query needed) so the Vendor step has somewhere real to link to.
 */
export default async function SignupFlowPreviewPage() {
  const bookableShows = await listBookableShows();
  const vendorShowId = bookableShows[0]?.showId ?? null;

  return <SignupFlowPreview vendorShowId={vendorShowId} />;
}
