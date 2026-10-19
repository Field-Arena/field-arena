'use client';

import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { PermissionKey } from '@/shared/constants/permissions';

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
          className="!border-[#FBCFC9] !text-[var(--fa-red)] hover:!bg-[var(--fa-red-tint)]"
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
