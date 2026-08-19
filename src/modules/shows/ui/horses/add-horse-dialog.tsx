'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
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
import { GhostButton, GoldButton, primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { IconX } from '@/shared/ui/organizer/icons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';
import { addManualHorseSchema, type AddManualHorseInput } from '@/modules/shows/schemas';
import { useAddManualHorse } from '@/modules/shows/hooks/use-horses-mutations';

const MANUAL_HORSE_FIELDS: {
  id: string;
  name: 'riderName' | 'horseName';
  label: string;
  placeholder: string;
}[] = [
  {
    id: 'mh-rider-name',
    name: 'riderName',
    label: 'Whose horse is this?',
    placeholder: "Rider name (or your own, if it's yours)",
  },
  { id: 'mh-horse-name', name: 'horseName', label: "Horse's name", placeholder: 'Horse name' },
];

export function AddHorseDialog({ showId }: { showId: string }) {
  const [open, setOpen] = useState(false);

  const resetDefaults: AddManualHorseInput = {
    showId,
    riderName: '',
    horseName: '',
    isStallion: false,
  };

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
        <Button type="button" variant="ghost" className={cn('h-auto', primaryButtonClass)}>
          <span aria-hidden>+</span> Add Horse
        </Button>
      </DialogTrigger>

      <DialogContent className={modalContentClass} showCloseButton={false}>
        <DialogHeader className={modalBodyClass + ' gap-1.5 pb-0'}>
          <ModalEyebrow>Horses</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            Add a horse
          </DialogTitle>
          <DialogDescription>
            For a horse with no real class entry behind it — yours, or any staff member&apos;s.
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              mutate(values);
            })(event);
          }}
          noValidate
        >
          <div className={modalBodyClass}>
            <input type="hidden" {...form.register('showId')} />

            {MANUAL_HORSE_FIELDS.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  {...form.register(field.name)}
                />
                {errors[field.name] && (
                  <p role="alert" className="text-status-danger text-[13px]">
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}

            <label className="text-ink-deep flex cursor-pointer items-center gap-2.5 text-[13px]">
              <input
                type="checkbox"
                className="accent-hunter-deep size-4"
                {...form.register('isStallion')}
              />
              This horse is a stallion
            </label>
          </div>

          <DialogFooter className={modalFooterClass}>
            <GhostButton
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </GhostButton>
            <GoldButton
              type="submit"
              disabled={isPending}
              className={cn(isPending && 'opacity-70')}
            >
              {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              {isPending ? 'Adding…' : 'Add horse'}
            </GoldButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
