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
  pairedCount = 0,
}: {
  online: boolean;
  pendingCount: number;
  pairedCount?: number;
}) {
  if (online && pendingCount === 0) return null;

  if (!online) {
    if (pairedCount > 0) {
      return (
        <StatusPill bg="#E9F3EC" border="#E9F3EC" fg="#1A5B3C" className="mb-4">
          Offline — relaying through a paired device
          {pendingCount > 0 ? ` (${String(pendingCount)} waiting)` : ''}.
        </StatusPill>
      );
    }
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
