'use client';

import { useExitOrganizerView } from '@/modules/superadmin/public';

export function ImpersonationBanner({ orgName }: { orgName?: string | null }) {
  const { isPending, exit } = useExitOrganizerView();

  return (
    <div className="fa-imp-banner fa-show">
      <span className="fa-tagp">Viewing as</span>
      <span>{orgName ?? 'An organizer'} — changes you make here affect their live data.</span>
      <button type="button" disabled={isPending} onClick={exit}>
        {isPending ? 'Exiting…' : 'Exit organizer view'}
      </button>
    </div>
  );
}
