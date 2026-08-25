'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { ghostButtonClass } from '@/shared/ui/organizer/buttons';
import { IconSettings } from '@/shared/ui/organizer/icons';
import { PERMISSION_KEYS } from '@/shared/constants/permissions';
import type { UserDirectoryRow } from '../types';

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
          <IconSettings size={14} /> Permissions
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">
            Permissions — {showName}
          </DialogTitle>
          <DialogDescription>
            What each person can actually do on this show. Click anyone to review or change their
            role and permissions.
          </DialogDescription>
        </DialogHeader>

        {staff.length === 0 ? (
          <p className="text-[13px] text-[#7A8781]">
            No staff on this show yet — add people above first.
          </p>
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
                    className="text-ink-deep hover:border-gold flex w-full items-center justify-between gap-3 rounded-lg border border-[#EDF0EE] px-3.5 py-2.5 text-left text-[13.5px] transition-colors"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{person.name}</strong>{' '}
                      <span className="text-[#7A8781]">— {person.role}</span>
                    </span>
                    <span className="text-forest flex-none text-[12.5px] font-semibold">
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
