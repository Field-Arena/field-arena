'use client';

import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import type { PermissionKey } from '@/shared/constants/permissions';

/**
 * Open/close scoring, publish/unpublish results, print. `toggleScoringOpen`
 * carries no extra permission check in legacy either (any admitted show
 * staff can flip it) — not adding one here that legacy never had.
 */
export function ScoringToolbar({
  open,
  resultsPublished,
  permissions,
  isTogglingOpen,
  isPublishing,
  onToggleOpen,
  onPublish,
  onUnpublish,
  onPrint,
}: {
  open: boolean;
  resultsPublished: boolean;
  permissions: Record<PermissionKey, boolean>;
  isTogglingOpen: boolean;
  isPublishing: boolean;
  onToggleOpen: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <GhostButton type="button" disabled={isTogglingOpen} onClick={onToggleOpen}>
        {open ? 'Close scoring' : 'Open scoring'}
      </GhostButton>

      {permissions.canPublishShow &&
        (resultsPublished ? (
          <GhostButton type="button" disabled={isPublishing} onClick={onUnpublish}>
            Unpublish results
          </GhostButton>
        ) : (
          <GoldButton type="button" disabled={isPublishing} onClick={onPublish}>
            Publish results
          </GoldButton>
        ))}

      <GhostButton type="button" onClick={onPrint}>
        Print
      </GhostButton>
    </div>
  );
}
