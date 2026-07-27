'use client';

import { useState } from 'react';
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

  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={() => {
          setEditOpen(true);
        }}
        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep transition hover:border-hunter-soft"
      >
        Edit
      </button>

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
        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep transition hover:border-hunter-soft disabled:opacity-45"
      >
        {org.suspended ? 'Reactivate' : 'Suspend'}
      </button>

      {org.deletedAt ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            remove.mutate({ id: org.id, value: false });
          }}
          className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-hunter-deep transition hover:border-hunter-soft disabled:opacity-45"
        >
          Restore
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setDeleteOpen(true);
          }}
          className="text-status-danger rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold transition hover:border-status-danger disabled:opacity-45"
        >
          Delete
        </button>
      )}

      {/*
        Impersonation is still inert, and says so. It needs the organizer
        workspace to accept an impersonated organization context, which it cannot
        yet — that workspace still renders fixed demo figures rather than reading
        an org from the session.
      */}
      <button
        type="button"
        disabled
        title="Entering as an organizer needs the organizer workspace to accept an org context — not migrated yet"
        className="rounded-lg border border-gold bg-gold-pale px-2.5 py-1.5 text-xs font-bold text-hunter-deep opacity-45"
      >
        Enter as organizer →
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
