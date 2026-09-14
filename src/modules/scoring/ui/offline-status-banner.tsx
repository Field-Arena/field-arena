'use client';

import { StatusPill } from '@/shared/ui/organizer/status-pill';

/**
 * Tells the judge/scribe what's happening with their connection, without
 * blocking anything — scoring keeps working underneath this either way. See
 * docs/offline-mode-plan.md (Phase 3).
 */
export function OfflineStatusBanner({
  online,
  pendingCount,
}: {
  online: boolean;
  pendingCount: number;
}) {
  if (online && pendingCount === 0) return null;

  if (!online) {
    return (
      <StatusPill bg="#FBF0D8" border="#FBF0D8" fg="#8A6D14" className="mb-4">
        Offline — your marks are saving on this device and will upload automatically once
        you&rsquo;re back online{pendingCount > 0 ? ` (${String(pendingCount)} waiting)` : ''}.
      </StatusPill>
    );
  }

  return (
    <StatusPill bg="#E6EFF6" border="#E6EFF6" fg="#37637F" className="mb-4">
      Back online — syncing {pendingCount} saved mark{pendingCount === 1 ? '' : 's'}…
    </StatusPill>
  );
}
