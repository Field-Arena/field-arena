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
import { useAddJudgesToShow, useAddStaffUser } from '../hooks/use-user-directory-mutations';
import type { JudgePickerOption } from '@/modules/judges/types';
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
  judges = [],
}: {
  shows: ShowListItem[];
  defaultShowId: string;
  classes: ClassOption[];
  /** The organization's saved judges, for "Add from my judges". */
  judges?: JudgePickerOption[];
}) {
  const [open, setOpen] = useState(false);
  const [judgeSearch, setJudgeSearch] = useState('');
  const [pickedJudgeIds, setPickedJudgeIds] = useState<string[]>([]);

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

  const addJudges = useAddJudgesToShow({
    onSuccess: () => {
      setOpen(false);
      setPickedJudgeIds([]);
      setJudgeSearch('');
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
        if (next) {
          form.reset(resetDefaults);
          setPickedJudgeIds([]);
          setJudgeSearch('');
        }
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

            {role === 'Judge' && judges.length > 0 && (
              <JudgePicker
                judges={judges}
                showId={defaultShowId}
                showName={showName}
                search={judgeSearch}
                onSearch={setJudgeSearch}
                picked={pickedJudgeIds}
                onPick={setPickedJudgeIds}
                pending={addJudges.isPending}
                onAdd={() => {
                  addJudges.mutate({ showId: defaultShowId, judgeIds: pickedJudgeIds });
                }}
              />
            )}

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

/* "Add from my judges": search the organization's saved judges and add several
 * to this show at once. Judges already on the show are shown but not selectable. */
function JudgePicker({
  judges,
  showId,
  showName,
  search,
  onSearch,
  picked,
  onPick,
  pending,
  onAdd,
}: {
  judges: JudgePickerOption[];
  showId: string;
  showName: string;
  search: string;
  onSearch: (value: string) => void;
  picked: string[];
  onPick: (ids: string[]) => void;
  pending: boolean;
  onAdd: () => void;
}) {
  const needle = search.trim().toLowerCase();
  const visible = judges.filter(
    (j) =>
      needle === '' ||
      j.name.toLowerCase().includes(needle) ||
      (j.email ?? '').toLowerCase().includes(needle),
  );

  return (
    <div className="rounded-xl border-[1.5px] border-[#1A5B3C] bg-[#F6FBF8] p-3">
      <Label htmlFor="au-judge-search" className="mb-1.5 block text-[11px] tracking-[.08em] uppercase">
        Add from my judges
      </Label>
      <Input
        id="au-judge-search"
        placeholder={`Search ${String(judges.length)} judge${judges.length === 1 ? '' : 's'}…`}
        value={search}
        onChange={(e) => {
          onSearch(e.target.value);
        }}
      />
      <div className="mt-2 max-h-[190px] overflow-y-auto rounded-lg border border-[#D9E1DD] bg-white">
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-[12.5px] text-[#7A8781]">No judge matches that search.</p>
        ) : (
          visible.map((j, i) => {
            const onShow = j.showIds.includes(showId);
            const checked = picked.includes(j.id);
            return (
              <label
                key={j.id}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 text-[13px]',
                  i > 0 && 'border-t border-[#EDF0EE]',
                  onShow ? 'cursor-default opacity-60' : 'cursor-pointer',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="accent-hunter-deep size-4"
                    disabled={onShow}
                    checked={checked}
                    onChange={(e) => {
                      onPick(
                        e.target.checked ? [...picked, j.id] : picked.filter((id) => id !== j.id),
                      );
                    }}
                  />
                  <span className="min-w-0 truncate">
                    <b>{j.name}</b>{' '}
                    <span className="text-[12px] font-semibold text-[#5A6B63]">
                      · {j.usefId ? `USEF ${j.usefId}` : 'no USEF ID yet'}
                    </span>
                  </span>
                </span>
                {onShow && (
                  <span className="flex-none rounded-[7px] bg-[#EDF0EE] px-2 py-0.5 text-[11.5px] font-extrabold text-[#5A6B63]">
                    on this show
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || picked.length === 0}
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-3.5 py-2 text-[13.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {picked.length === 0
            ? 'Pick judges to add'
            : `Add ${String(picked.length)} judge${picked.length === 1 ? '' : 's'} to ${showName}`}
        </button>
        <span className="text-[12px] font-semibold text-[#5A6B63]">
          Each gets an invite. A new judge? Fill in the form below and they are saved to your list.
        </span>
      </div>
    </div>
  );
}
