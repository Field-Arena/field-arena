'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { GhostButton, GoldButton } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { MEMBER_TYPES } from '@/modules/organizations/constants';
import type { MemberRow } from '@/modules/organizations/data/queries';
import {
  useCreateMember,
  useDeleteMember,
  useUpdateMember,
} from '@/modules/organizations/hooks/use-member-mutations';

const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-forest';
const FIELD =
  'w-full rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold';

export function MemberEditDialog({
  member,
  onClose,
}: {
  member: MemberRow | null;
  onClose: () => void;
}) {
  const isBusiness = (role: string) => role === 'Vendor';

  const [role, setRole] = useState(member?.role ?? 'Member');
  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [businessName, setBusinessName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [status, setStatus] = useState(member?.membershipStatus ?? 'active');
  const [expires, setExpires] = useState(member?.membershipExpires ?? '');
  const [notes, setNotes] = useState(member?.notes ?? '');
  const [extra, setExtra] = useState<Record<string, string>>(member?.extraFields ?? {});
  const [nameError, setNameError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreateMember({ onSuccess: onClose });
  const update = useUpdateMember({ onSuccess: onClose });
  const remove = useDeleteMember({ onSuccess: onClose });
  const pending = create.isPending || update.isPending;

  function submit() {
    const typed = isBusiness(role)
      ? businessName.trim()
      : [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    const name = typed === '' ? (member?.name ?? '') : typed;
    if (!name) {
      setNameError(true);
      return;
    }
    setNameError(false);

    const values = {
      name,
      firstName: isBusiness(role) ? '' : firstName,
      lastName: isBusiness(role) ? '' : lastName,
      role: role as (typeof MEMBER_TYPES)[number],
      email,
      phone,
      membershipStatus: status as 'active' | 'inactive',
      membershipExpires: expires,
      notes,
      extraFields: extra,
    };

    if (member) update.mutate({ ...values, id: member.id });
    else create.mutate(values);
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={modalContentClass + ' flex max-h-[85vh] flex-col sm:max-w-[520px]'}
        showCloseButton={false}
      >
        <DialogHeader className={modalBodyClass + ' flex-none gap-1.5 pb-0'}>
          <ModalEyebrow>Member Database</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {member ? member.name : 'Add member'}
          </DialogTitle>
          <DialogDescription>
            {member
              ? "In your organization's database"
              : "Add someone to your organization's database. This doesn't put them on any show yet."}
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={modalBodyClass + ' min-h-0 flex-1 space-y-4 overflow-y-auto'}>
          <div>
            <label htmlFor="mem-role" className={LABEL}>
              Type
            </label>
            <select
              id="mem-role"
              className={FIELD}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
              }}
            >
              {MEMBER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {isBusiness(role) ? (
            <div>
              <label htmlFor="mem-business" className={LABEL}>
                Business name
              </label>
              <Input
                id="mem-business"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                }}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mem-first" className={LABEL}>
                  First name
                </label>
                <Input
                  id="mem-first"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="mem-last" className={LABEL}>
                  Last name
                </label>
                <Input
                  id="mem-last"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mem-email" className={LABEL}>
                Email
              </label>
              <Input
                id="mem-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div>
              <label htmlFor="mem-phone" className={LABEL}>
                Phone
              </label>
              <Input
                id="mem-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mem-status" className={LABEL}>
                Membership
              </label>
              <select
                id="mem-status"
                className={FIELD}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label htmlFor="mem-expires" className={LABEL}>
                Expires
              </label>
              <Input
                id="mem-expires"
                type="date"
                value={expires}
                onChange={(e) => {
                  setExpires(e.target.value);
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="mem-notes" className={LABEL}>
              Notes
            </label>
            <Input
              id="mem-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
            />
          </div>

          {Object.keys(extra).length > 0 && (
            <div>
              <div className="text-forest mb-1 text-[12px] font-bold tracking-wide uppercase">
                Additional fields
              </div>
              <p className="mb-2 text-[12px] text-[#7A8781]">
                Picked up from an imported list — edit or clear any of these like any other field.
              </p>
              <div className="space-y-3">
                {Object.keys(extra)
                  .sort()
                  .map((key) => (
                    <div key={key}>
                      <label htmlFor={`mem-extra-${key}`} className={LABEL}>
                        {key}
                      </label>
                      <Input
                        id={`mem-extra-${key}`}
                        value={extra[key] ?? ''}
                        onChange={(e) => {
                          setExtra((prev) => ({ ...prev, [key]: e.target.value }));
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {nameError && (
            <p role="alert" className="text-[12.5px] text-[#B4432F]">
              Please enter a name.
            </p>
          )}
        </div>

        <DialogFooter className={modalFooterClass + ' items-center sm:justify-between'}>
          {member ? (
            <Button
              type="button"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => {
                setConfirmDelete(true);
              }}
              className="h-auto bg-transparent px-0 py-0 text-[12.5px] font-semibold text-[#B4432F] hover:bg-transparent hover:underline"
            >
              Delete from database
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <GhostButton type="button" onClick={onClose} disabled={pending}>
              Cancel
            </GhostButton>
            <GoldButton type="button" onClick={submit} disabled={pending}>
              {member ? 'Save changes' : 'Add member'}
              <span aria-hidden>✓</span>
            </GoldButton>
          </div>
        </DialogFooter>

        {member && (
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={`Delete ${member.name}?`}
            description="This does not remove them from any show they're already on."
            confirmLabel={remove.isPending ? 'Deleting…' : 'Delete'}
            destructive
            pending={remove.isPending}
            onConfirm={() => {
              remove.mutate(member.id);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
