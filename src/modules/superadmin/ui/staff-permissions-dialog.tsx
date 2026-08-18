'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type PermissionKey,
} from '@/shared/constants/permissions';
import { useUpdateStaffPermissions } from '@/modules/superadmin/hooks/use-org-staff-mutations';
import type { DirectoryStaff } from '@/modules/superadmin/types';

/**
 * The per-person permission editor, ported from the legacy openStaffPermModal.
 *
 * Opens showing the staff member's *resolved* permissions (role defaults, legacy
 * flags, then any explicit grants) and, on save, writes the whole set back as the
 * explicit `permissions` jsonb — so what you see is exactly what is stored. The
 * trigger button doubles as the "Permissions (X/N)" count.
 */
export function StaffPermissionsDialog({ staff }: { staff: DirectoryStaff }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<PermissionKey, boolean>>(staff.permissions);

  const update = useUpdateStaffPermissions({
    onSuccess: () => {
      setOpen(false);
    },
  });

  function onOpenChange(next: boolean) {
    // Re-seed from the source of truth each time it opens, so a cancelled edit
    // never leaks into the next one.
    if (next) setDraft(staff.permissions);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          onOpenChange(true);
        }}
        className="h-auto rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] font-bold text-forest transition-colors hover:border-gold hover:bg-[#FFFCF2]"
      >
        Permissions ({staff.permissionCount}/{PERMISSION_KEYS.length})
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">
            {staff.name}&apos;s permissions
          </DialogTitle>
          <DialogDescription>
            {staff.role} on {staff.showName}. Toggles below apply to this show only.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5">
          {PERMISSION_KEYS.map((key) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-[13.5px] text-hunter-deep transition-colors hover:bg-hunter-pale">
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, [key]: event.target.checked }));
                  }}
                  className="size-4 accent-hunter-deep"
                />
                {PERMISSION_LABELS[key]}
              </label>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={update.isPending}
            onClick={() => {
              update.mutate({ staffId: staff.id, permissions: draft });
            }}
          >
            {update.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
            {update.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
