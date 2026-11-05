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
        className="h-auto rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-[12.5px] font-bold text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-[#FBFCFD]"
      >
        Permissions ({staff.permissionCount}/{PERMISSION_KEYS.length})
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#101828]">
            {staff.name}&apos;s permissions
          </DialogTitle>
          <DialogDescription>
            {staff.role} on {staff.showName}. Toggles below apply to this show only.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5">
          {PERMISSION_KEYS.map((key) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E7EAEE] px-3 py-2.5 text-[13.5px] text-[#101828] transition-colors hover:bg-[#EAF5EF]">
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, [key]: event.target.checked }));
                  }}
                  className="size-4 accent-[#146A47]"
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
