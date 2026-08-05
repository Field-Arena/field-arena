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
import { Input } from '@/shared/ui/shadcn/input';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Label } from '@/shared/ui/shadcn/label';
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from '@/shared/constants/permissions';
import { ADD_USER_ROLES } from '../constants';
import {
  useChangeStaffRole,
  useUpdateStaffPermissions,
  useRemoveStaffAssignment,
  useReassignStaffShow,
  useUpdateStaffDetails,
} from '../hooks/use-user-directory-mutations';
import type { UserDirectoryRow } from '../types';
import type { ChangeStaffRoleInput } from '../schemas';
import type { ShowListItem } from '@/modules/shows/data/queries';

/** row.firstName/lastName is null for rows created before that split was tracked (e.g. superadmin's addOrgStaff) — falls back to splitting the combined name so the fields still start populated. */
function splitName(row: UserDirectoryRow): { firstName: string; lastName: string } {
  if (row.firstName || row.lastName) return { firstName: row.firstName ?? '', lastName: row.lastName ?? '' };
  const [firstName = '', ...rest] = row.name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

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
export function StaffEditDialog({
  row,
  shows,
  onClose,
}: {
  row: UserDirectoryRow | null;
  shows: ShowListItem[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!row}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        {row && <StaffEditForm key={row.key} row={row} shows={shows} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function emptyPermissions(): Record<PermissionKey, boolean> {
  const record = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) record[key] = false;
  return record;
}

function StaffEditForm({
  row,
  shows,
  onClose,
}: {
  row: UserDirectoryRow;
  shows: ShowListItem[];
  onClose: () => void;
}) {
  const [role, setRole] = useState(row.role);
  const [showId, setShowId] = useState(row.showId);
  const [draft, setDraft] = useState<Record<PermissionKey, boolean>>(row.permissions ?? emptyPermissions());
  const initialName = splitName(row);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [email, setEmail] = useState(row.email ?? '');
  const [phone, setPhone] = useState(row.phone ?? '');
  const [isSteward, setIsSteward] = useState(row.isSteward);

  const changeRole = useChangeStaffRole();
  const updatePermissions = useUpdateStaffPermissions({ onSuccess: onClose });
  const remove = useRemoveStaffAssignment({ onSuccess: onClose });
  const reassignShow = useReassignStaffShow();
  const updateDetails = useUpdateStaffDetails();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const roleOptions = [...new Set<string>([...ADD_USER_ROLES, row.role])];
  // The row's own show is always an option even if it's somehow missing from
  // `shows` (e.g. stale props), so the select never silently shows a value
  // that isn't in its own option list.
  const showOptions = shows.some((s) => s.id === row.showId)
    ? shows
    : [{ id: row.showId, name: row.showName }, ...shows];
  const pending =
    changeRole.isPending ||
    updatePermissions.isPending ||
    remove.isPending ||
    reassignShow.isPending ||
    updateDetails.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-xl text-hunter-deep">{row.name}</DialogTitle>
        <DialogDescription>
          {row.role} on {row.showName}. Role and permission changes apply to this show only.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="se-first-name">First name</Label>
          <Input
            id="se-first-name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="se-last-name">Last name</Label>
          <Input
            id="se-last-name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="se-email">Email</Label>
        <Input
          id="se-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="se-phone">Phone</Label>
        <Input
          id="se-phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
          }}
        />
      </div>

      {role === 'Announcer' && (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#EDF0EE] px-3 py-2.5 text-[13.5px] text-ink-deep transition-colors hover:bg-[#F5F7F6]">
          <input
            type="checkbox"
            checked={isSteward}
            onChange={(e) => {
              setIsSteward(e.target.checked);
            }}
            className="size-4 accent-hunter-deep"
          />
          Steward
        </label>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            updateDetails.mutate({ staffId: row.id, firstName, lastName, email, phone, isSteward });
          }}
        >
          {updateDetails.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
          {updateDetails.isPending ? 'Saving…' : 'Save details'}
        </Button>
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="se-show">Show</Label>
        <select
          id="se-show"
          className={SELECT_CLASS}
          value={showId}
          disabled={reassignShow.isPending}
          onChange={(e) => {
            const next = e.target.value;
            setShowId(next);
            reassignShow.mutate({ staffId: row.id, showId: next });
          }}
        >
          {showOptions.map((show) => (
            <option key={show.id} value={show.id}>
              {show.name}
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
