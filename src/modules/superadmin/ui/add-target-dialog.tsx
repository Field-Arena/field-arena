'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, PlusIcon } from 'lucide-react';
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
import { createLeadSchema, type CreateLeadInput } from '../schemas';
import { useCreateLead } from '../hooks/use-lead-mutations';
import { FormField } from './organizer-form-fields';

/**
 * "Add Target", ported from the Admin Console design's Add Target modal.
 *
 * Manually-sourced leads only — Calendly bookings arrive through the webhook and
 * land automatically. A new target always enters the funnel as "New".
 */
export function AddTargetDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { orgName: '', contactName: '', email: '', phone: '', website: '', showsPerYear: '' },
  });

  const { mutate, isPending } = useCreateLead({
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
          className="inline-flex items-center gap-2 rounded-[9px] bg-gold px-4 py-[11px] text-[13.5px] font-bold text-hunter-deep transition hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(201,162,39,.26)]"
        >
          <PlusIcon className="size-[15px]" aria-hidden />
          Add Target
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-6 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-hunter-deep">
              Manually sourced
            </span>
          </div>
          <DialogTitle className="font-[family-name:var(--font-nr)] text-[28px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep">
            Add Target
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            Add an organization to the sales target list. Leads booked through Calendly are added
            automatically — this is for manually-sourced targets.
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
            id="at-org"
            label="Organization name"
            placeholder="Peachtree Dressage Association"
            error={errors.orgName}
            registration={form.register('orgName')}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="at-contact"
              label="Contact name"
              placeholder="Jane Whitfield"
              error={errors.contactName}
              registration={form.register('contactName')}
            />
            <FormField
              id="at-email"
              label="Email"
              type="email"
              placeholder="jane@example.com"
              error={errors.email}
              registration={form.register('email')}
            />
            <FormField
              id="at-phone"
              label="Phone"
              placeholder="(404) 555-0134"
              error={errors.phone}
              registration={form.register('phone')}
            />
            <FormField
              id="at-website"
              label="Website"
              placeholder="example.com"
              error={errors.website}
              registration={form.register('website')}
            />
          </div>

          <div className="max-w-[240px]">
            <FormField
              id="at-shows"
              label="Shows managed per year"
              placeholder="6"
              error={errors.showsPerYear}
              registration={form.register('showsPerYear')}
            />
            <p className="mt-2 text-xs text-fa-muted-2">
              Leave blank if you don&apos;t know yet — it fills in after the demo.
            </p>
          </div>

          <DialogFooter className="items-center">
            <span className="mr-auto text-[12.5px] text-fa-muted-2">Lands in the funnel as “New”.</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-gold text-hunter-deep hover:bg-gold-light"
            >
              {isPending ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <ArrowRightIcon className="size-[14px]" aria-hidden />
              )}
              {isPending ? 'Adding…' : 'Add lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
