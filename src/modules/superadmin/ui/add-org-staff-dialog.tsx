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
import { addOrgStaffSchema, type AddOrgStaffInput } from '../schemas';
import { useAddOrgStaff } from '../hooks/use-org-staff-mutations';
import { FormField } from './organizer-form-fields';

const SELECT_CLASS =
  'w-full rounded-lg border border-field bg-white px-3 py-2 text-[14px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none';

/**
 * "+ Add a user" for one organizer, ported from openAddOrgStaffModal.
 *
 * Staff are per-show, so a show is picked here alongside email and role — it is
 * the same shape as the invite flow the organizer uses for their own team. The
 * trigger is disabled when the organizer has no shows to assign anyone to.
 */
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
        <button
          type="button"
          disabled={!hasShows}
          title={hasShows ? undefined : 'This organizer has no shows to assign staff to yet'}
          className="rounded-lg border border-hunter-deep bg-hunter-deep px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span aria-hidden>＋</span> Add a user
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Add a user</DialogTitle>
          <DialogDescription>
            Same invite flow {orgName} uses for their own team — email, role, and a show to assign
            them to.
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

          <FormField
            id="aos-name"
            label="Name (optional)"
            placeholder="Jane Smith"
            error={errors.name}
            registration={form.register('name')}
          />

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
