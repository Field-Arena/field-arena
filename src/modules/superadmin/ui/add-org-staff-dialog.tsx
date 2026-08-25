'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { GRANTABLE_ROLES } from '@/shared/constants/roles';
import { addOrgStaffSchema, type AddOrgStaffInput } from '@/modules/superadmin/schemas';
import { useAddOrgStaff } from '@/modules/superadmin/hooks/use-org-staff-mutations';
import { FormField } from '@/modules/superadmin/ui/organizer-form-field';

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
              mutate(values);
            })(event);
          }}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="aos-show">Show</Label>
            <Controller
              control={form.control}
              name="showId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="aos-show" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="aos-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRANTABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
