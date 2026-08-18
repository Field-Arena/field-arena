'use client';

import { useTransition } from 'react';
import { setPreviewRole } from '../data/preview-role';
import { setSelectedOrg } from '../data/org-selection';

/**
 * Wraps setPreviewRole for OrganizerShell — the "Organizer/Show Admin" rail
 * toggle and the "Viewing as" dropdown both end in a redirect(), so there is
 * no result to cache and no success state to react to; a mutation hook would
 * risk its own try/catch intercepting the redirect's thrown signal before
 * Next's router ever sees it. `runTransition` exposes the same pending flag
 * for setRailRole (the Judge/Scribe rail toggle), which lives in
 * shared/lib/rail-role.ts and is called directly from the component — the
 * three controls share one pending/disabled state, matching the shell's
 * existing behavior.
 */
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

/** Wraps setSelectedOrg for OrganizerShell's "Organization" switcher — same redirect-only reasoning as useOrganizerShellPreview above. */
export function useOrganizerShellOrgSwitch() {
  const [isPending, startTransition] = useTransition();

  function setOrg(orgId: string, returnTo?: string): void {
    startTransition(async () => {
      await setSelectedOrg(orgId, returnTo);
    });
  }

  return { isPending, setOrg };
}
