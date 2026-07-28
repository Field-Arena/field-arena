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
import { updateOrganizationSchema, type UpdateOrganizationInput } from '../schemas';
import {
  useSetOrganizationDeleted,
  useSetOrganizationSuspended,
  useUpdateOrganization,
} from '../hooks/use-organization-mutations';
import { FeeModelField, FormField } from './organizer-form-fields';
import { enterAsOrganizer } from '../data/impersonation';
import type { OrganizationSummary } from '../data/queries';

/**
 * Per-row actions: Edit, Suspend/Reactivate, Delete.
 *
 * Suspend has no confirmation because it is fully reversible — the shows become
 * invisible to riders and every row stays put. Delete does, because it is a soft
 * delete with no undo in the UI; the confirmation text is the legacy wording,
 * which is unusually careful and worth keeping verbatim: it tells the operator
 * exactly what survives.
 */
export function OrganizationRowActions({ org }: { org: OrganizationSummary }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [entering, startEntering] = useTransition();
  const suspend = useSetOrganizationSuspended();
  const remove = useSetOrganizationDeleted();
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

  /**
   * Button order and labels follow the legacy row exactly (superadmin.html
   * lines 1108-1119): Resend invite (pending only), Edit, Delete, Suspend, then
   * the impersonation button — whose label is "Preview onboarding form" rather
   * than "Enter as organizer" for a pending org, because there is no organizer
   * account to act as yet.
   */
  const pending = !org.onboarded;

  return (
    <span className="flex items-center justify-end gap-1.5">
      {/*
        useTransition rather than a mutation hook: enterAsOrganizer ends in a
        redirect, so there is no result to cache and no success state to toast —
        the only UI need is a pending flag while the navigation happens.

        The label differs for a pending org because there is no organizer account
        to act as yet — the legacy row said "Preview onboarding form" for the same
        reason.
      */}
      <button
        type="button"
        disabled={entering}
        title="Full impersonation — you'll act as this organizer, not just view their shows"
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-line-strong px-3 py-2 text-[12.5px] font-bold text-forest transition-colors hover:border-gold hover:bg-[#FFFCF2] disabled:opacity-45"
        onClick={() => {
          startEntering(async () => {
            await enterAsOrganizer(org.id);
          });
        }}
      >
        {entering ? 'Entering…' : pending ? 'Preview onboarding' : 'Enter as organizer'}
        <ArrowRightIcon className="size-[13px]" aria-hidden />
      </button>

      {/*
        Everything else collapses into an overflow menu. Four buttons abreast
        overflowed the actions column and wrapped onto a second line, which broke
        the row rhythm — and only one of them is the action anyone actually
        reaches for. Destructive items sit last, behind a separator.
      */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for ${org.name}`}
          className="grid size-8 flex-none place-items-center rounded-lg border border-transparent text-fa-muted-2 transition-colors hover:border-field hover:bg-white hover:text-forest"
        >
          <EllipsisVerticalIcon className="size-4" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52 rounded-xl border-line-mint p-1.5">
          <DropdownMenuItem
            onSelect={() => {
              setEditOpen(true);
            }}
          >
            <PencilIcon className="size-[15px] text-fa-muted" aria-hidden />
            Edit organizer
          </DropdownMenuItem>

          {pending && (
            <DropdownMenuItem
              disabled
              title="Send a fresh Organizer invite email — needs the email provider configured"
            >
              <MailIcon className="size-[15px] text-fa-muted" aria-hidden />
              Resend invite
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled={busy}
            onSelect={() => {
              suspend.mutate({ id: org.id, value: !org.suspended });
            }}
          >
            <CircleSlashIcon className="size-[15px] text-fa-muted" aria-hidden />
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
              <RotateCcwIcon className="size-[15px] text-fa-muted" aria-hidden />
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

      {/* ---- Edit ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">
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
              <FormField
                id={`eo-email-${org.id}`}
                label="Contact email"
                type="email"
                error={errors.email}
                registration={form.register('email')}
              />
              <FormField
                id={`eo-phone-${org.id}`}
                label="Phone"
                error={errors.phone}
                registration={form.register('phone')}
              />
            </div>
            <FormField
              id={`eo-website-${org.id}`}
              label="Website"
              placeholder="https://"
              error={errors.website}
              registration={form.register('website')}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                id={`eo-city-${org.id}`}
                label="City"
                error={errors.city}
                registration={form.register('city')}
              />
              <FormField
                id={`eo-region-${org.id}`}
                label="State"
                error={errors.region}
                registration={form.register('region')}
              />
              <FormField
                id={`eo-country-${org.id}`}
                label="Country"
                error={errors.country}
                registration={form.register('country')}
              />
            </div>
            <FeeModelField
              id={`eo-feemodel-${org.id}`}
              registration={form.register('feeModel')}
            />

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

      {/* ---- Delete confirmation ---- */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">
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
                  }
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
