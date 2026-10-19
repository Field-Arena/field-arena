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
import { cn } from '@/shared/lib/utils';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import type { DirectoryStaff } from '@/modules/superadmin/types';
import {
  useChangeStaffRole,
  useRemoveStaffAssignment,
} from '@/modules/superadmin/hooks/use-org-staff-mutations';
import { StaffPermissionsDialog } from '@/modules/superadmin/ui/staff-permissions-dialog';
import { StatusPill } from '@/modules/superadmin/ui/directory-org-status-pill';

export const STAFF_COLS = 'minmax(180px,1.3fr) 128px minmax(96px,0.7fr) 96px 118px 84px';
const NR = 'font-[family-name:var(--font-nr)]';

export function StaffRow({ staff }: { staff: DirectoryStaff }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const changeRole = useChangeStaffRole();
  const remove = useRemoveStaffAssignment({
    onSuccess: () => {
      setConfirmOpen(false);
    },
  });

  const isVendor = staff.role === 'Vendor';

  return (
    <div
      className="grid min-w-[740px] items-center gap-3 border-b border-[#F5F7F8] px-4 py-2.5 last:border-b-0 hover:bg-[#FBFCFD]"
      style={{ gridTemplateColumns: STAFF_COLS }}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-[#101828]">{staff.name}</span>
        <span className="truncate text-[11.5px] text-[#8A94A3]">{staff.email ?? '—'}</span>
      </span>

      {isVendor ? (
        <span className="inline-flex h-[34px] items-center justify-center rounded-lg bg-[#EAF5EF] px-2 text-[11px] font-bold text-[#101828]">
          Vendor
        </span>
      ) : (
        <select
          value={staff.role}
          disabled={changeRole.isPending}
          onChange={(event) => {
            changeRole.mutate({
              staffId: staff.id,
              role: event.target.value as (typeof GRANTABLE_ROLES)[number],
            });
          }}
          className="rounded-[7px] border border-[#E7EAEE] bg-white px-2 py-[7px] text-[12.5px] text-[#101828] focus-visible:border-[#9FD3BA] focus-visible:outline-none disabled:opacity-50"
          aria-label={`Role for ${staff.name}`}
        >
          {GRANTABLE_ROLES.filter((r) => r !== 'Vendor').map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      )}

      <span className="text-[12px] leading-[1.4] text-[#475467]" title={staff.showName}>
        {staff.showName}
      </span>

      <StatusPill status={staff.status} />

      {isVendor ? (
        <span className="text-center text-[11px] text-[#8A94A3]">—</span>
      ) : (
        <StaffPermissionsDialog staff={staff} />
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirmOpen(true);
          }}
          className="h-auto rounded-[7px] border border-[#FBCFC9] px-2.5 py-1.5 text-[11.5px] font-bold text-[#B42318] transition-colors hover:border-[#B42318] hover:bg-[#FEF3F2]"
        >
          Remove
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className={cn(NR, 'text-[26px] font-medium text-[#101828]')}>
              Remove {staff.name}?
            </DialogTitle>
            <DialogDescription>
              They&apos;ll be removed from {staff.showName}&apos;s staff. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(staff.id);
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {remove.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
