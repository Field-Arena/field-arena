'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, XIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { addSuperAdminSchema, type AddSuperAdminInput } from '../schemas';
import { useAddSuperAdmin } from '../hooks/use-superadmin-user-mutations';

const FIELD =
  'h-auto w-full rounded-[10px] border-line-strong bg-white px-3.5 py-2.5 text-[14px] text-hunter-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';
const LABEL = 'mb-2 block text-[11px] font-bold uppercase tracking-[.08em] text-hunter-deep';

/**
 * "+ Add Super Admin", ported from the legacy console's openAddSuperAdminModal.
 *
 * Styled to the Admin Console design (gold-ruled "Full access" eyebrow, serif
 * title, divider-separated footer) rather than the shared FormField/Dialog
 * footer defaults — those are shared by other dialogs across the app, and this
 * one has its own distinct look in the design, so it is built inline here the
 * same way DemoDialog builds the landing page's own look.
 *
 * Name and email only — every Super Admin has identical, platform-wide access,
 * so there is nothing else to grant. On submit the person is invited by email
 * and provisioned as a Super Admin immediately; see addSuperAdmin for why both
 * happen together.
 */
export function AddSuperAdminDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<AddSuperAdminInput>({
    resolver: zodResolver(addSuperAdminSchema),
    defaultValues: { name: '', email: '' },
  });

  const { mutate, isPending } = useAddSuperAdmin({
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
          className="rounded-lg border border-hunter-deep bg-hunter-deep px-3.5 py-2 text-[13px] font-bold text-white transition hover:brightness-110"
        >
          <span aria-hidden>＋</span> Add Super Admin
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-[20px] border-line-strong bg-white p-0 sm:max-w-[520px]"
      >
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute top-5 right-5 grid size-9 place-items-center rounded-[10px] bg-hunter-pale text-hunter-deep transition-colors hover:bg-line-strong"
          >
            <XIcon className="size-[18px]" aria-hidden />
          </button>
        </DialogClose>

        <DialogHeader className="gap-0 px-8 pt-8 pb-6">
          <div className="mb-3.5 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-[26px] bg-gold" />
            <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
              Full access
            </span>
          </div>
          <DialogTitle className="font-[family-name:var(--font-nr)] text-[28px] font-medium leading-[1.1] tracking-[-.02em] text-hunter-deep">
            Add Super Admin
          </DialogTitle>
          <DialogDescription className="mt-2.5 text-[14.5px] leading-[1.6] text-fa-muted">
            Invite another person with full Super Admin access — impersonate any organizer,
            suspend/reactivate accounts, everything this account can do. They&apos;ll get an email
            to set a password and sign in.
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
          <div className="grid gap-4 border-t border-line px-8 py-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="asa-name" className={LABEL}>
                Name
              </Label>
              <Input
                id="asa-name"
                placeholder="Jordan Reyes"
                aria-invalid={!!errors.name}
                className={FIELD}
                {...form.register('name')}
              />
              {errors.name && (
                <p role="alert" className="mt-1.5 text-[12.5px] text-status-danger">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="asa-email" className={LABEL}>
                Email
              </Label>
              <Input
                id="asa-email"
                type="email"
                placeholder="jordan@example.com"
                aria-invalid={!!errors.email}
                className={FIELD}
                {...form.register('email')}
              />
              {errors.email && (
                <p role="alert" className="mt-1.5 text-[12.5px] text-status-danger">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-[20px] border-t border-line bg-hunter-pale px-8 py-5">
            <span className="text-[13px] text-fa-muted">Access starts the moment they accept.</span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="rounded-[10px] border border-line-strong bg-white px-4 py-2.5 text-[13.5px] font-bold text-hunter-deep transition-colors hover:border-hunter-deep"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-[10px] bg-hunter-deep px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:brightness-110 disabled:opacity-70"
              >
                {isPending ? 'Sending…' : 'Send invite'}
                {isPending ? (
                  <Loader2Icon className="size-[15px] animate-spin" aria-hidden />
                ) : (
                  <ArrowRightIcon className="size-[15px]" aria-hidden />
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
