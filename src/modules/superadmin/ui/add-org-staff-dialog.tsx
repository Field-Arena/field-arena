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
import { Label } from '@/shared/ui/shadcn/label';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { addOrgStaffSchema, type AddOrgStaffInput } from '@/modules/superadmin/schemas';
import { useAddOrgStaff } from '@/modules/superadmin/hooks/use-org-staff-mutations';
import { FormField } from '@/modules/superadmin/ui/organizer-form-field';

const SELECT_CLASS =
  'w-full rounded-lg border border-field bg-white px-3 py-2 text-[14px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none';

export function AddOrgStaffDialog({
  orgName,
  shows,
}: {
  orgName: string;
  shows: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const hasShows = shows.length > 0;

  const form = useForm<AddOrgStaffInput>({
    resolver: zodResolver(addOrgStaffSchema),
    defaultValues: {
      showId: shows[0]?.id ?? '',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      role: 'Show Admin',
    },
  });

  const { mutate, isPending } = useAddOrgStaff({
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
          disabled={!hasShows}
          title={hasShows ? undefined : 'This organizer has no shows to assign staff to yet'}
          className="border-hunter-deep bg-hunter-deep h-auto rounded-lg border px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-transparent hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span aria-hidden>＋</span> Add a user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">Add a user</DialogTitle>
          <DialogDescription>
            Same invite flow {orgName} uses for their own team — email, role, and a show to assign
            them to.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              const name = [values.firstName, values.lastName]
                .map((part) => part?.trim() ?? '')
                .filter(Boolean)
                .join(' ');
              mutate({ ...values, name });
            })(event);
          }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="aos-show">Show</Label>
            <select id="aos-show" className={SELECT_CLASS} {...form.register('showId')}>
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="aos-first"
              label="First name"
              placeholder="Jane"
              error={errors.firstName}
              registration={form.register('firstName')}
            />
            <FormField
              id="aos-last"
              label="Last name"
              placeholder="Whitfield"
              error={errors.lastName}
              registration={form.register('lastName')}
            />
          </div>

          <FormField
            id="aos-email"
            label="Email"
            type="email"
            placeholder="jane@example.com"
            error={errors.email}
            registration={form.register('email')}
          />

          <div className="space-y-1.5">
            <Label htmlFor="aos-role">Role</Label>
            <select id="aos-role" className={SELECT_CLASS} {...form.register('role')}>
              {GRANTABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

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
              {isPending ? 'Adding…' : 'Add user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
