'use client';

import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import type { PermissionKey } from '@/shared/constants/permissions';
import type { MySeat } from '@/modules/scoring/types';
import { formatTimestamp } from '@/shared/lib/format/date';

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
  mySeat,
  orderChecked,
  isMarkingOrderChecked,
  onMarkOrderChecked,
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
  mySeat: MySeat | null;
  orderChecked: { at: string; byName: string } | null;
  isMarkingOrderChecked: boolean;
  onMarkOrderChecked: () => void;
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

      {orderChecked ? (
        <span className="text-fa-muted text-[12.5px]">
          Order checked by {orderChecked.byName} — {formatTimestamp(orderChecked.at)}
        </span>
      ) : (
        mySeat?.role === 'scribe' && (
          <GhostButton type="button" disabled={isMarkingOrderChecked} onClick={onMarkOrderChecked}>
            Mark order checked
          </GhostButton>
        )
      )}
    </div>
  );
}
