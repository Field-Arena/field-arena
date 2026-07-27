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
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { createOrganizationSchema, type CreateOrganizationInput } from '../schemas';
import { useCreateOrganization } from '../hooks/use-organization-mutations';
import { FeeModelField, FormField } from './organizer-form-fields';

/**
 * "+ Add Organizer", ported from the legacy console's add-organizer modal.
 *
 * Creates the organization and its owner invite together, because an
 * organization whose owner has never accepted cannot be administered by anyone
 * but a SuperAdmin.
 *
 * The legacy modal also carried FEI / USDF / USEF checkboxes. They are not here
 * because governing bodies are per-show in this schema
 * (shows.governing_bodies), not per-organization — a single organizer commonly
 * runs both a recognised and a schooling show. Putting them on the organization
 * would force one answer for every show it ever runs.
 */
export function AddOrganizerDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      contactFirstName: '',
      contactLastName: '',
      contactTitle: '',
      contactEmail: '',
      city: '',
      region: '',
      country: 'US',
      feeModel: 'default',
    },
  });

  const { mutate, isPending } = useCreateOrganization({
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-lg border border-hunter-deep bg-hunter-deep px-3 py-1.5 text-[13px] font-bold text-white transition hover:brightness-110"
        >
          + Add Organizer
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Add Organizer</DialogTitle>
          <DialogDescription>
            Creates the organization and invites its first Organizer, who gets full access to every
            show it runs.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              mutate(values);
            })(event);
          }}
          className="space-y-4"
          noValidate
        >
          <FormField
            id="ao-name"
            label="Organization name"
            placeholder="Peachtree Dressage Association"
            error={errors.name}
            registration={form.register('name')}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="ao-first"
              label="Owner first name"
              error={errors.contactFirstName}
              registration={form.register('contactFirstName')}
            />
            <FormField
              id="ao-last"
              label="Owner last name"
              error={errors.contactLastName}
              registration={form.register('contactLastName')}
            />
          </div>

          <FormField
            id="ao-title"
            label="Title (optional)"
            placeholder="Show Secretary"
            error={errors.contactTitle}
            registration={form.register('contactTitle')}
          />

          <FormField
            id="ao-email"
            label="Owner email"
            type="email"
            placeholder="owner@theirbarn.com"
            error={errors.contactEmail}
            registration={form.register('contactEmail')}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              id="ao-city"
              label="City"
              error={errors.city}
              registration={form.register('city')}
            />
            <FormField
              id="ao-region"
              label="State"
              error={errors.region}
              registration={form.register('region')}
            />
            <FormField
              id="ao-country"
              label="Country"
              error={errors.country}
              registration={form.register('country')}
            />
          </div>

          <FeeModelField id="ao-feemodel" registration={form.register('feeModel')} />

          <p className="text-fa-muted rounded-lg border border-border bg-cream px-3 py-2 text-xs leading-relaxed">
            The invite is recorded and valid for 7 days, but no email is sent yet — the email
            provider is not configured. The organizer will show as Pending until they accept.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {isPending ? 'Adding…' : 'Add organizer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
