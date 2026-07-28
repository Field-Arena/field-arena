'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  createShowSchema,
  DISCIPLINES,
  GOVERNING_BODIES,
  type CreateShowInput,
} from '../schemas';
import { useCreateShow } from '../hooks/use-show-mutations';

/**
 * Create a show.
 *
 * Only the fields a show genuinely cannot exist without. Classes, divisions,
 * add-ons, the waiver and the ring layout are all configured afterwards in Show
 * Manager — asking for them up front would make a nine-step wizard out of what
 * is really one decision: "there is a show, on these dates, of this kind".
 *
 * A new show is always unpublished. Going live is a separate, deliberate act
 * gated on waiver approval.
 */
export function NewShowForm() {
  const form = useForm<CreateShowInput>({
    resolver: zodResolver(createShowSchema),
    defaultValues: {
      name: '',
      venueName: '',
      startDate: '',
      endDate: '',
      dateLabel: '',
      disciplines: ['Dressage'],
      governingBodies: [],
      showType: 'rated',
      timezone: '',
      startingRiderNumber: 101,
    },
  });

  const { mutate, isPending } = useCreateShow();
  const { errors } = form.formState;

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          mutate(values);
        })(event);
      }}
      className="max-w-[640px] space-y-5"
      noValidate
    >
      <Field id="name" label="Show name" error={errors.name?.message}>
        <Input id="name" placeholder="Autumn Leaves Dressage Classic" {...form.register('name')} />
      </Field>

      <Field id="venueName" label="Venue" error={errors.venueName?.message}>
        <Input id="venueName" placeholder="Wills Park Equestrian" {...form.register('venueName')} />
        <p className="text-fa-muted mt-1 text-xs">
          Free text. Add it to your Venues library separately if you run there often.
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="startDate" label="Start date" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...form.register('startDate')} />
        </Field>
        <Field id="endDate" label="End date" error={errors.endDate?.message}>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </Field>
      </div>

      <Field id="dateLabel" label="Date label (optional)" error={errors.dateLabel?.message}>
        <Input id="dateLabel" placeholder="Jul 10 – Jul 12, 2026" {...form.register('dateLabel')} />
        <p className="text-fa-muted mt-1 text-xs">
          What riders see. Built from the dates above if you leave it blank.
        </p>
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-semibold text-ink">Disciplines</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {DISCIPLINES.map((discipline) => (
            <label key={discipline} className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" value={discipline} {...form.register('disciplines')} />
              {discipline}
            </label>
          ))}
        </div>
        {errors.disciplines && (
          <p role="alert" className="text-status-danger text-[13px]">
            {errors.disciplines.message}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-semibold text-ink">Governing bodies</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {GOVERNING_BODIES.map((body) => (
            <label key={body} className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" value={body} {...form.register('governingBodies')} />
              {body}
            </label>
          ))}
        </div>
        <p className="text-fa-muted text-xs">
          Per show, not per organization — the same organizer often runs both recognised and
          schooling shows.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="showType" label="Show type" error={errors.showType?.message}>
          <select
            id="showType"
            className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-[13.5px] text-ink outline-none focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30"
            {...form.register('showType')}
          >
            <option value="rated">Rated</option>
            <option value="schooling">Schooling</option>
          </select>
        </Field>

        <Field
          id="startingRiderNumber"
          label="First rider number"
          error={errors.startingRiderNumber?.message}
        >
          <Input
            id="startingRiderNumber"
            type="number"
            min={1}
            {...form.register('startingRiderNumber')}
          />
        </Field>
      </div>

      <Field id="timezone" label="Timezone (optional)" error={errors.timezone?.message}>
        <Input id="timezone" placeholder="America/New_York" {...form.register('timezone')} />
        <p className="text-fa-muted mt-1 text-xs">
          Set per show, since one organizer may run shows in different zones. Left blank, times show
          as local venue time.
        </p>
      </Field>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
          {isPending ? 'Creating…' : 'Create show'}
        </Button>
        <p className="text-fa-muted text-xs">
          Created unpublished. Riders cannot see it until you publish, which needs the waiver
          approved.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-status-danger text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
