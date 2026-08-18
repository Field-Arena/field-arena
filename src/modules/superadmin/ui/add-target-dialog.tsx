'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { createLeadSchema, type CreateLeadInput } from '@/modules/superadmin/schemas';
import { useCreateLead } from '@/modules/superadmin/hooks/use-lead-mutations';

const FIELD =
  'h-auto w-full rounded-[10px] border-line-strong bg-white px-3.5 py-2.5 text-[14px] text-hunter-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';
const LABEL = 'mb-2 block text-[11px] font-bold uppercase tracking-[.08em] text-hunter-deep';

/**
 * "Add Target", built to the same Admin Console dialog recipe as
 * AddSuperAdminDialog: gold-ruled eyebrow, serif title, divider-separated
 * form, and a shaded footer — rather than the shared FormField/Dialog footer
 * defaults, which other, plainer dialogs in the console still use.
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

  const TOP_FIELDS: { id: string; name: 'orgName'; label: string; placeholder: string }[] = [
    { id: 'at-org', name: 'orgName', label: 'Organization name', placeholder: 'Peachtree Dressage Association' },
  ];
  const GRID_FIELDS: {
    id: string;
    name: 'contactName' | 'email' | 'phone' | 'website';
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { id: 'at-contact', name: 'contactName', label: 'Contact name', placeholder: 'Jane Whitfield' },
    { id: 'at-email', name: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
    { id: 'at-phone', name: 'phone', label: 'Phone', placeholder: '(404) 555-0134' },
    { id: 'at-website', name: 'website', label: 'Website', placeholder: 'example.com' },
  ];

  function renderField(f: { id: string; name: keyof CreateLeadInput; label: string; placeholder: string; type?: string }) {
    const error = errors[f.name];
    return (
      <div key={f.id}>
        <Label htmlFor={f.id} className={LABEL}>
          {f.label}
        </Label>
        <Input
          id={f.id}
          type={f.type}
          placeholder={f.placeholder}
          aria-invalid={!!error}
          className={FIELD}
          {...form.register(f.name)}
        />
        {error && (
          <p role="alert" className="mt-1.5 text-[12.5px] text-status-danger">
            {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto inline-flex items-center gap-2 rounded-[9px] bg-gold px-4 py-[11px] text-[13.5px] font-bold text-hunter-deep hover:bg-gold-light transition hover:shadow-[0_8px_24px_rgba(201,162,39,.26)]"
        >
          <PlusIcon className="size-[15px]" aria-hidden />
          Add Target
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-0 overflow-y-auto rounded-[20px] border-line-strong bg-white p-0 sm:max-w-[560px]"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label="Close"
            className="absolute top-5 right-5 grid size-9 place-items-center rounded-[10px] bg-hunter-pale p-0 text-hunter-deep transition-colors hover:bg-line-strong"
          >
            <XIcon className="size-[18px]" aria-hidden />
          </Button>
        </DialogClose>

        <DialogHeader className="gap-0 px-8 pt-8 pb-6">
          <div className="mb-3.5 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-[26px] bg-gold" />
            <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
              Manually sourced
            </span>
          </div>
          <DialogTitle className="font-[family-name:var(--font-nr)] text-[28px] font-medium leading-[1.1] tracking-[-.02em] text-hunter-deep">
            Add Target
          </DialogTitle>
          <DialogDescription className="mt-2.5 text-[14.5px] leading-[1.6] text-fa-muted">
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
          noValidate
        >
          <div className="space-y-4 border-t border-line px-8 py-6">
            {TOP_FIELDS.map(renderField)}

            <div className="grid gap-4 sm:grid-cols-2">{GRID_FIELDS.map(renderField)}</div>

            <div className="max-w-[240px]">
              <Label htmlFor="at-shows" className={LABEL}>
                Shows managed per year
              </Label>
              <Input
                id="at-shows"
                placeholder="6"
                aria-invalid={!!errors.showsPerYear}
                className={FIELD}
                {...form.register('showsPerYear')}
              />
              {errors.showsPerYear ? (
                <p role="alert" className="mt-1.5 text-[12.5px] text-status-danger">
                  {errors.showsPerYear.message}
                </p>
              ) : (
                <p className="mt-2 text-xs leading-[1.5] text-fa-muted-2">
                  Leave blank if you don&apos;t know yet — it fills in after the demo.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-[20px] border-t border-line bg-hunter-pale px-8 py-5">
            <span className="text-[13px] text-fa-muted">Lands in the funnel as &ldquo;New&rdquo;.</span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                }}
                className="h-auto rounded-[10px] border border-line-strong bg-white px-4 py-2.5 text-[13.5px] font-bold text-hunter-deep hover:bg-transparent transition-colors hover:border-hunter-deep"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ghost"
                disabled={isPending}
                className="h-auto inline-flex items-center gap-2 rounded-[10px] bg-gold px-4 py-2.5 text-[13.5px] font-bold text-hunter-deep hover:bg-gold-light transition hover:shadow-[0_8px_24px_rgba(201,162,39,.26)] disabled:opacity-70"
              >
                {isPending ? 'Adding…' : 'Add Lead'}
                {isPending ? (
                  <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
                ) : (
                  <ArrowRightIcon className="size-[15px]" aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
