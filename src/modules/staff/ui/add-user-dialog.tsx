'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { GhostButton, GoldButton, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';
import { ADD_USER_ROLES } from '../constants';
import { addStaffUserSchema, type AddStaffUserInput } from '../schemas';
import { useAddStaffUser } from '../hooks/use-user-directory-mutations';
import type { ShowListItem } from '@/modules/shows/data/queries';

const SELECT_CLASS =
  'w-full rounded-lg border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold';

export interface ClassOption {
  id: string;
  label: string;
}

export function AddUserDialog({
  shows,
  defaultShowId,
  classes,
}: {
  shows: ShowListItem[];
  defaultShowId: string;
  classes: ClassOption[];
}) {
  const [open, setOpen] = useState(false);

  const resetDefaults: AddStaffUserInput = {
    showId: defaultShowId,
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    role: ADD_USER_ROLES[0],
    isSteward: false,
    canScratchSkipDq: false,
    canViewMoney: false,
    addToMemberDatabase: false,
    membershipStatus: 'active',
    membershipExpires: '',
    classIds: [],
  };

  const form = useForm<AddStaffUserInput>({
    resolver: zodResolver(addStaffUserSchema),
    defaultValues: resetDefaults,
  });

  const { mutate, isPending } = useAddStaffUser({
    onSuccess: () => {
      setOpen(false);
      form.reset(resetDefaults);
    },
  });

  const { errors } = form.formState;
  const role = useWatch({ control: form.control, name: 'role' });
  const isMember = useWatch({ control: form.control, name: 'addToMemberDatabase' });
  const classIds = useWatch({ control: form.control, name: 'classIds' }) ?? [];
  const isVendor = role === 'Vendor';
  const isRider = role === 'Rider';
  const showName = shows.find((s) => s.id === defaultShowId)?.name ?? 'this show';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(resetDefaults);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={primaryButtonClass}>
          <span aria-hidden>+</span> Add User
        </button>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Users</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            Add a User
          </DialogTitle>
          <DialogDescription>
            Invite someone to {showName}. They&apos;ll get a real email invite and fill in the rest
            — role details, phone, whatever applies — themselves.
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              if (values.role === 'Rider') {
                toast.success(`${values.email} added.`);
                setOpen(false);
                form.reset(resetDefaults);
                return;
              }
              mutate(values);
            })(event);
          }}
          noValidate
        >
          <div className={modalBodyClass}>
            <input type="hidden" {...form.register('showId')} />

            {isVendor ? (
              <div className="space-y-1.5">
                <Label htmlFor="au-business-name">Business name</Label>
                <Input
                  id="au-business-name"
                  placeholder="Trailside Tack Co."
                  {...form.register('businessName')}
                />
                {errors.businessName && (
                  <p role="alert" className="text-status-danger text-[13px]">
                    {errors.businessName.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="au-first-name">First name</Label>
                  <Input id="au-first-name" placeholder="Jane" {...form.register('firstName')} />
                  {errors.firstName && (
                    <p role="alert" className="text-status-danger text-[13px]">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="au-last-name">Last name</Label>
                  <Input id="au-last-name" placeholder="Smith" {...form.register('lastName')} />
                  {errors.lastName && (
                    <p role="alert" className="text-status-danger text-[13px]">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="au-email">Email</Label>
                <Input
                  id="au-email"
                  type="email"
                  placeholder="jane@example.com"
                  {...form.register('email')}
                />
                {errors.email && (
                  <p role="alert" className="text-status-danger text-[13px]">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="au-role">User type</Label>
                <select id="au-role" className={SELECT_CLASS} {...form.register('role')}>
                  {ADD_USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(role === 'Judge' || role === 'Scribe') && (
              <div>
                <Label className="mb-1.5 block">
                  Which tests/classes are they {role === 'Judge' ? 'judging' : 'recording for'}?
                </Label>
                {classes.length === 0 ? (
                  <p className="text-[12.5px] text-[#7A8781]">
                    No classes with entries yet for this show — you can assign tests after adding
                    classes.
                  </p>
                ) : (
                  <div className="max-h-[180px] overflow-y-auto rounded-lg border border-[#D9E1DD] px-2.5 py-2">
                    {classes.map((cls) => (
                      <label
                        key={cls.id}
                        className="text-ink-deep flex cursor-pointer items-center gap-1.5 py-1 text-[12.5px]"
                      >
                        <input
                          type="checkbox"
                          className="accent-hunter-deep size-4"
                          checked={classIds.includes(cls.id)}
                          onChange={(e) => {
                            form.setValue(
                              'classIds',
                              e.target.checked
                                ? [...classIds, cls.id]
                                : classIds.filter((id) => id !== cls.id),
                            );
                          }}
                        />
                        {cls.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {role === 'Announcer' && (
              <label className="text-ink-deep flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  className="accent-hunter-deep size-4"
                  {...form.register('isSteward')}
                />
                Also handles ring steward duties (gate, order of go)
              </label>
            )}

            {!isVendor && !isRider && (
              <>
                <label className="text-ink-deep flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    className="accent-hunter-deep size-4"
                    {...form.register('canScratchSkipDq')}
                  />
                  Can scratch, skip, or eliminate riders on this show
                </label>

                <label className="text-ink-deep flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    className="accent-hunter-deep size-4"
                    {...form.register('canViewMoney')}
                  />
                  Can view financial data ($) for this show
                </label>
              </>
            )}

            <div className="border-t border-[#E9EDEB] pt-4">
              <label className="text-ink-deep flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold">
                <input
                  type="checkbox"
                  className="accent-hunter-deep size-4"
                  {...form.register('addToMemberDatabase')}
                />
                Also a member of your organization
              </label>

              {isMember && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="au-membership-status">Membership</Label>
                    <select
                      id="au-membership-status"
                      className={SELECT_CLASS}
                      {...form.register('membershipStatus')}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="au-membership-expires">Renewal date</Label>
                    <Input
                      id="au-membership-expires"
                      type="date"
                      {...form.register('membershipExpires')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className={modalFooterClass}>
            <GhostButton
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </GhostButton>
            <GoldButton
              type="submit"
              disabled={isPending}
              className={cn(isPending && 'opacity-70')}
            >
              {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              {isPending ? 'Inviting…' : 'Invite'}
              {!isPending && <span aria-hidden>→</span>}
            </GoldButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
