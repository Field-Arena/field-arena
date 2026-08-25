'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRightIcon,
  CircleSlashIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
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
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from '@/modules/superadmin/schemas';
import {
  useResendOrganizerInvite,
  useSetOrganizationDeleted,
  useSetOrganizationSuspended,
  useUpdateOrganization,
} from '@/modules/superadmin/hooks/use-organization-mutations';
import { FeeModelField } from '@/modules/superadmin/ui/fee-model-field';
import { FormField } from '@/modules/superadmin/ui/organizer-form-field';
import { enterAsOrganizer } from '@/shared/lib/impersonation';
import type { OrganizationSummary } from '@/modules/superadmin/types';

export function OrganizationRowActions({ org }: { org: OrganizationSummary }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [entering, startEntering] = useTransition();
  const suspend = useSetOrganizationSuspended();
  const remove = useSetOrganizationDeleted();
  const resendInvite = useResendOrganizerInvite();
  const update = useUpdateOrganization({
    onSuccess: () => {
      setEditOpen(false);
    },
  });

  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      id: org.id,
      name: org.name,
      email: '',
      phone: '',
      website: '',
      city: org.city ?? '',
      region: org.region ?? '',
      country: '',
      feeModel: org.feeModel === 'gmo' ? 'gmo' : 'default',
    },
  });

  const { errors } = form.formState;
  const busy = suspend.isPending || remove.isPending;

  const pending = !org.onboarded;

  return (
    <span className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="ghost"
        disabled={entering}
        title="Full impersonation — you'll act as this organizer, not just view their shows"
        className="border-line-strong text-forest hover:border-gold inline-flex h-auto items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-bold whitespace-nowrap transition-colors hover:bg-[#FFFCF2] disabled:opacity-45"
        onClick={() => {
          startEntering(async () => {
            await enterAsOrganizer(org.id);
          });
        }}
      >
        {entering ? 'Entering…' : 'Enter as organizer'}
        <ArrowRightIcon className="size-[13px]" aria-hidden />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for ${org.name}`}
          className="text-fa-muted-2 hover:border-field hover:text-forest grid size-8 flex-none place-items-center rounded-lg border border-transparent transition-colors hover:bg-white"
        >
          <EllipsisVerticalIcon className="size-4" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="border-line-mint w-52 rounded-xl p-1.5">
          <DropdownMenuItem
            onSelect={() => {
              setEditOpen(true);
            }}
          >
            <PencilIcon className="text-fa-muted size-[15px]" aria-hidden />
            Edit organizer
          </DropdownMenuItem>

          {pending && (
            <DropdownMenuItem
              disabled={resendInvite.isPending}
              onSelect={() => {
                resendInvite.mutate(org.id);
              }}
            >
              <MailIcon className="text-fa-muted size-[15px]" aria-hidden />
              {resendInvite.isPending ? 'Sending…' : 'Resend invite'}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled={busy}
            onSelect={() => {
              suspend.mutate({ id: org.id, value: !org.suspended });
            }}
          >
            <CircleSlashIcon className="text-fa-muted size-[15px]" aria-hidden />
            {org.suspended ? 'Reactivate access' : 'Suspend access'}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#EEF2EF]" />

          {org.deletedAt ? (
            <DropdownMenuItem
              disabled={busy}
              onSelect={() => {
                remove.mutate({ id: org.id, value: false });
              }}
            >
              <RotateCcwIcon className="text-fa-muted size-[15px]" aria-hidden />
              Restore organizer
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={busy}
              variant="destructive"
              onSelect={() => {
                setDeleteOpen(true);
              }}
            >
              <Trash2Icon className="size-[15px]" aria-hidden />
              Delete organizer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">
              Edit Organizer
            </DialogTitle>
            <DialogDescription>{org.name}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              void form.handleSubmit((values) => {
                update.mutate(values);
              })(event);
            }}
            className="space-y-4"
            noValidate
          >
            <FormField
              id={`eo-name-${org.id}`}
              label="Organization name"
              error={errors.name}
              registration={form.register('name')}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: 'email' as const, label: 'Contact email', type: 'email' },
                { name: 'phone' as const, label: 'Phone', type: undefined },
              ].map((f) => (
                <FormField
                  key={f.name}
                  id={`eo-${f.name}-${org.id}`}
                  label={f.label}
                  type={f.type}
                  error={errors[f.name]}
                  registration={form.register(f.name)}
                />
              ))}
            </div>
            <FormField
              id={`eo-website-${org.id}`}
              label="Website"
              placeholder="https://"
              error={errors.website}
              registration={form.register('website')}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: 'city' as const, label: 'City' },
                { name: 'region' as const, label: 'State' },
                { name: 'country' as const, label: 'Country' },
              ].map((f) => (
                <FormField
                  key={f.name}
                  id={`eo-${f.name}-${org.id}`}
                  label={f.label}
                  error={errors[f.name]}
                  registration={form.register(f.name)}
                />
              ))}
            </div>
            <FeeModelField id={`eo-feemodel-${org.id}`} control={form.control} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
                {update.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">
              Delete {org.name}?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              This organizer and their staff will no longer be able to log in, and riders can no
              longer buy into their shows. All existing shows, orders, riders and history are kept,
              not erased — but this can only be undone from here or by direct database access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(
                  { id: org.id, value: true },
                  {
                    onSuccess: () => {
                      setDeleteOpen(false);
                    },
                  },
                );
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {remove.isPending ? 'Deleting…' : 'Delete organizer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
