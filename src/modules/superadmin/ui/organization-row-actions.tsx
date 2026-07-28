'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const buttonClass =
    'rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep transition hover:border-hunter-soft disabled:opacity-45';

  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {pending && (
        <button
          type="button"
          disabled
          title="Send (or resend) a fresh Organizer invite email — needs the email provider configured"
          className={buttonClass}
          style={{ opacity: 0.45 }}
        >
          Resend invite
        </button>
      )}

      <button
        type="button"
        title="Edit this organizer's account details"
        onClick={() => {
          setEditOpen(true);
        }}
        className={buttonClass}
      >
        Edit
      </button>

      {org.deletedAt ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            remove.mutate({ id: org.id, value: false });
          }}
          className={buttonClass}
        >
          Restore
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          title="Delete this organizer — soft delete, all data is kept"
          onClick={() => {
            setDeleteOpen(true);
          }}
          className="text-status-danger rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold transition hover:border-status-danger disabled:opacity-45"
        >
          Delete
        </button>
      )}

      <button
        type="button"
        disabled={busy}
        title={
          org.suspended
            ? 'Reactivate this organizer — riders can purchase again'
            : 'Suspend this organizer — their shows become invisible to riders'
        }
        onClick={() => {
          suspend.mutate({ id: org.id, value: !org.suspended });
        }}
        className={buttonClass}
      >
        {org.suspended ? 'Reactivate' : 'Suspend'}
      </button>

      {/*
        useTransition rather than a mutation hook: enterAsOrganizer ends in a
        redirect, so there is no result to cache and no success state to toast —
        the only UI need is a pending flag while the navigation happens.
      */}
      <button
        type="button"
        disabled={entering}
        title="Full impersonation — you'll act as this organizer, not just view their shows"
        onClick={() => {
          startEntering(async () => {
            await enterAsOrganizer(org.id);
          });
        }}
        className="rounded-lg border border-gold bg-gold-pale px-2.5 py-1.5 text-xs font-bold text-hunter-deep transition hover:border-gold-dark disabled:opacity-45"
      >
        {entering ? 'Entering…' : pending ? 'Preview onboarding form →' : 'Enter as organizer →'}
      </button>

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
