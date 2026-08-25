'use client';

import { useTransition } from 'react';
import { setPreviewRole } from '../data/preview-role';
import { setSelectedOrg } from '../data/org-selection';

export function useOrganizerShellPreview() {
  const [isPending, startTransition] = useTransition();

  function setPreview(role: 'organizer' | 'showadmin', returnTo?: string): void {
    startTransition(async () => {
      await setPreviewRole(role, returnTo);
    });
  }

  function runTransition(action: () => Promise<void>): void {
    startTransition(action);
  }

  return { isPending, setPreview, runTransition };
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
