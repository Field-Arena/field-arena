'use client';

import { Dialog, DialogContent } from '@/shared/ui/shadcn/dialog';
import { StableConfigBody } from '@/modules/organizations/ui/stable-config-body';
import type { VenueStable } from '@/modules/organizations/types';

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
