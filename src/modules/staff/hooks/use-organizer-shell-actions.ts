'use client';

import { useTransition } from 'react';
import { setPreviewRole } from '../data/preview-role';
import { setSelectedOrg } from '../data/org-selection';
import { useSetRailRole } from '@/modules/superadmin/public';

export function useOrganizerShellPreview() {
  const [isPending, startTransition] = useTransition();
  const railRole = useSetRailRole();

  function setPreview(role: 'organizer' | 'showadmin', returnTo?: string): void {
    startTransition(async () => {
      await setPreviewRole(role, returnTo);
    });
  }

  return {
    isPending: isPending || railRole.isPending,
    setPreview,
    setRailRole: railRole.setRole,
  };
}

export function useOrganizerShellOrgSwitch() {
  const [isPending, startTransition] = useTransition();

  function setOrg(orgId: string, returnTo?: string): void {
    startTransition(async () => {
      await setSelectedOrg(orgId, returnTo);
    });
  }

  return { isPending, setOrg };
}
