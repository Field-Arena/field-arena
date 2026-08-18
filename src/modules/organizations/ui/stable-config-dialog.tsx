'use client';

import { Dialog, DialogContent } from '@/shared/ui/shadcn/dialog';
import { StableConfigBody } from '@/modules/organizations/ui/stable-config-body';
import type { VenueStable } from '@/modules/organizations/types';

/**
 * "Stable — stalls" — the per-stall grid, ported from showstaff.html's
 * `renderLocStableConfigModal`/`locStallRename`/`locStallToggleClosed`
 * (~lines 5347-5417). The durable part of a stable: how many stalls, what
 * each is named, and which are out of service — deliberately no
 * horse/rider assignment, which stays a per-show runtime concern on
 * `shows.stable_chart`'s own Stable Chart.
 *
 * Renders as its own top-level Dialog rather than nested inside
 * VenueFormDialog's JSX — Radix portals both to document.body regardless of
 * where they're mounted, so this opens layered on top of the venue form the
 * same way legacy's #loc-stable-config-modal overlays #locationEditorHtml.
 */
export function StableConfigDialog({
  stable,
  open,
  onOpenChange,
  onChange,
}: {
  stable: VenueStable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: VenueStable) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        {stable && (
          <StableConfigBody
            stable={stable}
            onChange={onChange}
            onDone={() => {
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
