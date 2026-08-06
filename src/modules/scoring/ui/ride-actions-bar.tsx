'use client';

import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { PermissionKey } from '@/shared/constants/permissions';

/** Skip / Scratch / Disqualify / Undo — each gated by its own permission, matching legacy exactly. */
export function RideActionsBar({
  permissions,
  disabled,
  canUndo,
  onSkip,
  onScratch,
  onDisqualify,
  onUndo,
}: {
  permissions: Record<PermissionKey, boolean>;
  disabled: boolean;
  canUndo: boolean;
  onSkip: () => void;
  onScratch: () => void;
  onDisqualify: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {permissions.canSkip && (
        <GhostButton type="button" disabled={disabled} onClick={onSkip}>
          Skip
        </GhostButton>
      )}
      {permissions.canScratch && (
        <GhostButton type="button" disabled={disabled} onClick={onScratch}>
          Scratch
        </GhostButton>
      )}
      {permissions.canEliminate && (
        <GhostButton
          type="button"
          disabled={disabled}
          onClick={onDisqualify}
          className="border-[#E3B8B8] text-[#B23A3A] hover:border-[#B23A3A]"
        >
          Disqualify
        </GhostButton>
      )}
      {canUndo && (
        <GhostButton type="button" onClick={onUndo}>
          ↩ Undo
        </GhostButton>
      )}
    </div>
  );
}
