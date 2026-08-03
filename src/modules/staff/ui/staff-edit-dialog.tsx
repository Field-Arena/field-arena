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
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Label } from '@/shared/ui/shadcn/label';
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from '@/shared/constants/permissions';
import { ADD_USER_ROLES } from '../constants';
import {
  useChangeStaffRole,
  useUpdateStaffPermissions,
  useRemoveStaffAssignment,
} from '../hooks/use-user-directory-mutations';
import type { UserDirectoryRow } from '../types';
import type { ChangeStaffRoleInput } from '../schemas';

const SELECT_CLASS =
  'w-full rounded-lg border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold';

/**
 * The edit surface for one staff_assignments row — role and the full
 * permission set — opened by clicking a staff row in the "All Users" table or
 * from the "User Permissions" list. Ported from the useful part of legacy's
 * `openUserEdit`/`userPermissionsModalContent`: this app already resolves
 * permissions correctly (`resolveStaffPermissions`), so what was missing was
 * an editing surface, not the resolution logic.
 *
 * Riders and vendors have no staff_assignments row and are not editable
 * through this dialog — the caller only opens it for `kind === 'staff'` rows.
 *
 * The Dialog itself always mounts (so it can animate closed); its edit-buffer
 * form is a separate component keyed by `row.key`, so switching to a
 * different row remounts fresh local state instead of syncing it from a prop
 * in an effect.
 */
export function StaffEditDialog({ row, onClose }: { row: UserDirectoryRow | null; onClose: () => void }) {
  return (
    <Dialog
      open={!!row}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        {row && <StaffEditForm key={row.key} row={row} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function emptyPermissions(): Record<PermissionKey, boolean> {
  const record = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) record[key] = false;
  return record;
}

function StaffEditForm({ row, onClose }: { row: UserDirectoryRow; onClose: () => void }) {
  const [role, setRole] = useState(row.role);
  const [draft, setDraft] = useState<Record<PermissionKey, boolean>>(row.permissions ?? emptyPermissions());

  const changeRole = useChangeStaffRole();
  const updatePermissions = useUpdateStaffPermissions({ onSuccess: onClose });
  const remove = useRemoveStaffAssignment({ onSuccess: onClose });
  const [confirmRemove, setConfirmRemove] = useState(false);

  const roleOptions = [...new Set<string>([...ADD_USER_ROLES, row.role])];
  const pending = changeRole.isPending || updatePermissions.isPending || remove.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-xl text-hunter-deep">{row.name}</DialogTitle>
        <DialogDescription>
          {row.role} on {row.showName}. Role and permission changes apply to this show only.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="se-role">User type</Label>
        <select
          id="se-role"
          className={SELECT_CLASS}
          value={role}
          disabled={changeRole.isPending}
          onChange={(e) => {
            const next = e.target.value;
            setRole(next);
            changeRole.mutate({ staffId: row.id, role: next as ChangeStaffRoleInput['role'] });
          }}
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-1.5">
        {PERMISSION_KEYS.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#EDF0EE] px-3 py-2.5 text-[13.5px] text-ink-deep transition-colors hover:bg-[#F5F7F6]">
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

      <DialogFooter className="items-center justify-between sm:justify-between">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirmRemove(true);
          }}
          className="text-[12.5px] font-semibold text-[#B4432F] hover:underline disabled:opacity-50"
        >
          Remove from this show
        </button>

        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title={`Remove ${row.name} from ${row.showName}?`}
          description="They keep their account and any other shows they are staffed on — only this assignment goes."
          confirmLabel={remove.isPending ? 'Removing…' : 'Remove'}
          destructive
          pending={remove.isPending}
          onConfirm={() => {
            remove.mutate(row.id);
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              updatePermissions.mutate({ staffId: row.id, permissions: draft });
            }}
          >
            {updatePermissions.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
            {updatePermissions.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
