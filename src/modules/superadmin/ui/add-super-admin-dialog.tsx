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
import { addSuperAdminSchema, type AddSuperAdminInput } from '../schemas';
import { useAddSuperAdmin } from '../hooks/use-superadmin-user-mutations';
import { FormField } from './organizer-form-fields';

/**
 * "+ Add Super Admin", ported from the legacy console's openAddSuperAdminModal.
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

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Add Super Admin</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Invite another person with full Super Admin access — impersonate any organizer,
            suspend/reactivate accounts, everything this account can do. They&apos;ll get an email to
            set a password and sign in.
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
            id="asa-name"
            label="Name"
            placeholder="e.g. Jordan Reyes"
            error={errors.name}
            registration={form.register('name')}
          />
          <FormField
            id="asa-email"
            label="Email"
            type="email"
            placeholder="jordan@example.com"
            error={errors.email}
            registration={form.register('email')}
          />

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
              {isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
