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
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { addManualHorseSchema, type AddManualHorseInput } from '../../schemas';
import { useAddManualHorse } from '../../hooks/use-horses-mutations';

/**
 * "+ Add Horse" — for a horse with no real class entry behind it: the
 * organizer's own, or any staff member's if they're also riding. Ported from
 * showstaff.html's openManualHorseModal/submitManualHorse (~13596-13622).
 * Writes to shows.manual_horses, not a real horses/riders row — kept
 * intentionally lightweight (no rider account, no document uploads) for the
 * same reason legacy's own comment gives: forcing a full rider signup just to
 * appear on this list would be a much bigger ask than what's actually needed.
 *
 * Deliberately does not include the "🏠 Stable Chart" button legacy renders
 * on this same toolbar — that's a distinct, page-sized feature
 * (shows.stable_chart) that lives in horses-screen.tsx instead, not part of
 * a horses *list* dialog. See modules/shows/ui/stable-chart/.
 */
export function AddHorseDialog({ showId }: { showId: string }) {
  const [open, setOpen] = useState(false);

  const resetDefaults: AddManualHorseInput = { showId, riderName: '', horseName: '', isStallion: false };

  const form = useForm<AddManualHorseInput>({
    resolver: zodResolver(addManualHorseSchema),
    defaultValues: resetDefaults,
  });

  const { mutate, isPending } = useAddManualHorse({
    onSuccess: () => {
      setOpen(false);
      form.reset(resetDefaults);
    },
  });

  const { errors } = form.formState;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(resetDefaults);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={primaryButtonClass}>
          <span aria-hidden>+</span> Add Horse
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">Add a horse</DialogTitle>
          <DialogDescription>
            For a horse with no real class entry behind it — yours, or any staff member&apos;s.
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
          <input type="hidden" {...form.register('showId')} />

          <div className="space-y-1.5">
            <Label htmlFor="mh-rider-name">Whose horse is this?</Label>
            <Input
              id="mh-rider-name"
              placeholder="Rider name (or your own, if it's yours)"
              {...form.register('riderName')}
            />
            {errors.riderName && (
              <p role="alert" className="text-status-danger text-[13px]">
                {errors.riderName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mh-horse-name">Horse&apos;s name</Label>
            <Input id="mh-horse-name" placeholder="Horse name" {...form.register('horseName')} />
            {errors.horseName && (
              <p role="alert" className="text-status-danger text-[13px]">
                {errors.horseName.message}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-deep">
            <input type="checkbox" className="size-4 accent-hunter-deep" {...form.register('isStallion')} />
            This horse is a stallion
          </label>

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
            <Button type="submit" disabled={isPending} className={cn(isPending && 'opacity-70')}>
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {isPending ? 'Adding…' : 'Add horse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
