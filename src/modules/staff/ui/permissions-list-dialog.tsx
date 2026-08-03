'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';
import type { UserDirectoryRow } from '../types';

/**
 * "User Permissions" — a fast way into each staff member's permission editor,
 * ported from legacy's `openAccessLevelsModal`: a per-show list of staff,
 * each showing a live "N/13 on" permission count that opens the full editor
 * (StaffEditDialog) on click. The legacy version also let a role be changed
 * right from this list; that's already the first field inside the editor
 * dialog it opens into here, so it isn't duplicated a second time.
 */
export function PermissionsListDialog({
  staff,
  showName,
  onEditStaff,
}: {
  staff: UserDirectoryRow[];
  showName: string;
  onEditStaff: (row: UserDirectoryRow) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={ghostButtonClass}>
          User Permissions
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Permissions — {showName}</DialogTitle>
          <DialogDescription>
            What each person can actually do on this show. Click anyone to review or change their
            role and permissions.
          </DialogDescription>
        </DialogHeader>

        {staff.length === 0 ? (
          <p className="text-[13px] text-[#7A8781]">No staff on this show yet — add people above first.</p>
        ) : (
          <ul className="space-y-1.5">
            {staff.map((person) => {
              const grantedCount = person.permissions
                ? PERMISSION_KEYS.filter((k) => person.permissions?.[k]).length
                : 0;
              return (
                <li key={person.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onEditStaff(person);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#EDF0EE] px-3.5 py-2.5 text-left text-[13.5px] text-ink-deep transition-colors hover:border-gold"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{person.name}</strong> <span className="text-[#7A8781]">— {person.role}</span>
                    </span>
                    <span className="flex-none text-[12.5px] font-semibold text-forest">
                      {grantedCount}/{PERMISSION_KEYS.length} on →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
