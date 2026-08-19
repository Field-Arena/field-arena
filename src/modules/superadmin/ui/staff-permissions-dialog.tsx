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

export function StaffPermissionsDialog({ staff }: { staff: DirectoryStaff }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<PermissionKey, boolean>>(staff.permissions);

  const update = useUpdateStaffPermissions({
    onSuccess: () => {
      setOpen(false);
    },
  });

  function onOpenChange(next: boolean) {
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
        className="border-line-strong text-forest hover:border-gold h-auto rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition-colors hover:bg-[#FFFCF2]"
      >
        Permissions ({staff.permissionCount}/{PERMISSION_KEYS.length})
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">
            {staff.name}&apos;s permissions
          </DialogTitle>
          <DialogDescription>
            {staff.role} on {staff.showName}. Toggles below apply to this show only.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5">
          {PERMISSION_KEYS.map((key) => (
            <li key={key}>
              <label className="border-border text-hunter-deep hover:bg-hunter-pale flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[13.5px] transition-colors">
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, [key]: event.target.checked }));
                  }}
                  className="accent-hunter-deep size-4"
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
