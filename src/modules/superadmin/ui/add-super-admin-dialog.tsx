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
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { addSuperAdminSchema, type AddSuperAdminInput } from '@/modules/superadmin/schemas';
import { useAddSuperAdmin } from '@/modules/superadmin/hooks/use-superadmin-user-mutations';

const FIELD =
  'h-auto w-full rounded-[10px] border-line-strong bg-white px-3.5 py-2.5 text-[14px] text-hunter-deep ' +
  'placeholder:text-[#9AA6A0] focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/[.16]';
const LABEL = 'mb-2 block text-[11px] font-bold uppercase tracking-[.08em] text-hunter-deep';

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
        <Button
          type="button"
          variant="ghost"
          className="border-hunter-deep bg-hunter-deep h-auto rounded-lg border px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-transparent hover:brightness-110"
        >
          <span aria-hidden>＋</span> Add Super Admin
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="border-line-strong gap-0 rounded-[20px] bg-white p-0 sm:max-w-[520px]"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label="Close"
            className="bg-hunter-pale text-hunter-deep hover:bg-line-strong absolute top-5 right-5 grid size-9 place-items-center rounded-[10px] p-0 transition-colors"
          >
            <XIcon className="size-[18px]" aria-hidden />
          </Button>
        </DialogClose>

        <DialogHeader className="gap-0 px-8 pt-8 pb-6">
          <div className="mb-3.5 flex items-center gap-3">
            <span aria-hidden className="bg-gold h-[3px] w-[26px]" />
            <span className="text-gold text-[10.5px] font-bold tracking-[.18em] uppercase">
              Full access
            </span>
          </div>
          <DialogTitle className="text-hunter-deep font-[family-name:var(--font-nr)] text-[28px] leading-[1.1] font-medium tracking-[-.02em]">
            Add Super Admin
          </DialogTitle>
          <DialogDescription className="text-fa-muted mt-2.5 text-[14.5px] leading-[1.6]">
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
          <div className="border-line grid gap-4 border-t px-8 py-6 sm:grid-cols-2">
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
                <p role="alert" className="text-status-danger mt-1.5 text-[12.5px]">
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
                <p role="alert" className="text-status-danger mt-1.5 text-[12.5px]">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="border-line bg-hunter-pale flex flex-wrap items-center justify-between gap-3 rounded-b-[20px] border-t px-8 py-5">
            <span className="text-fa-muted text-[13px]">Access starts the moment they accept.</span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                }}
                className="border-line-strong text-hunter-deep hover:border-hunter-deep h-auto rounded-[10px] border bg-white px-4 py-2.5 text-[13.5px] font-bold transition-colors hover:bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ghost"
                disabled={isPending}
                className="bg-hunter-deep inline-flex h-auto items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-transparent hover:brightness-110 disabled:opacity-70"
              >
                {isPending ? 'Sending…' : 'Send invite'}
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
