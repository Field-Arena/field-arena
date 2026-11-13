'use client';

import { useState } from 'react';
import { useUpdateHorse } from '@/modules/riders/hooks/use-horse-mutations';
import { horseUpdateSchema, USEF_EXEMPT_REASON_EX } from '@/modules/riders/schemas';
import type { HorseWithDocumentUrls } from '@/modules/riders/types';
import {
  horseToUsefValues,
  isOwnerRider,
  resolveOwnerValues,
  type HorseUsefValues,
  type RiderOwnerSource,
} from '@/modules/riders/utils/horse-usef';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';

type FieldKey = keyof HorseUsefValues;

const NATIVE_SELECT_CLASS =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2 py-1 text-base outline-none focus-visible:ring-3 disabled:opacity-50 md:text-sm';

export function HorseUsefSection({
  horse,
  rider,
}: {
  horse: HorseWithDocumentUrls;
  rider: RiderOwnerSource;
}) {
  const updateHorse = useUpdateHorse();
  const [values, setValues] = useState<HorseUsefValues>(() => horseToUsefValues(horse));
  const [ownerIsRider, setOwnerIsRider] = useState(() => isOwnerRider(horse, rider));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saved, setSaved] = useState(false);

  const owner = resolveOwnerValues(ownerIsRider, values, rider);
  const shown: HorseUsefValues = { ...values, ...owner };

  function setField(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function field(key: FieldKey, label: string, options?: FieldOptions) {
    const isOwnerField = key.startsWith('owner');
    const disabled = isOwnerField && ownerIsRider;
    const id = `${key}-${horse.id}`;
    return (
      <div className={`space-y-1.5 ${options?.className ?? ''}`}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={options?.type}
          inputMode={options?.inputMode}
          placeholder={options?.placeholder}
          maxLength={options?.maxLength}
          disabled={disabled}
          aria-invalid={errors[key] ? true : undefined}
          value={shown[key]}
          onChange={(event) => {
            setField(key, event.target.value);
          }}
        />
        {errors[key] && <p className="text-xs text-red-700">{errors[key]}</p>}
      </div>
    );
  }

  function save() {
    const finalOwner = resolveOwnerValues(ownerIsRider, values, rider);
    const input = { id: horse.id, ...values, ...finalOwner };
    const result = horseUpdateSchema.safeParse(input);
    if (!result.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !(key in next)) next[key as FieldKey] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    updateHorse.mutate(input, {
      onSuccess: () => {
        setSaved(true);
      },
    });
  }

  const reasonDisabled = ownerIsRider || shown.ownerUsef.trim() !== '';

  return (
    <div className="border-line space-y-4 rounded-lg border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-forest text-xs font-semibold tracking-wide uppercase">
          For USEF results
        </div>
        <p className="text-fa-muted text-xs">
          Enter once — it comes with {horse.name} into every show
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {field('usefNumber', 'Horse USEF number', { inputMode: 'numeric', maxLength: 20 })}
        {field('feiNumber', 'FEI number', { placeholder: 'optional', maxLength: 20 })}
        {field('passportNumber', 'Passport number', {
          placeholder: 'FEI competitions only',
          maxLength: 20,
        })}
        {field('registrationNumber', 'Breed registration number', { maxLength: 50 })}
        {field('yearOfBirth', 'Year of birth', { inputMode: 'numeric', maxLength: 4 })}
        {field('breed', 'Breed', { maxLength: 50 })}
      </div>

      <div className="space-y-3">
        <div className="text-forest text-xs font-semibold tracking-wide uppercase">Owner</div>
        <label className="text-forest flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ownerIsRider}
            onChange={(event) => {
              setOwnerIsRider(event.target.checked);
              setSaved(false);
            }}
          />
          <span>
            <span className="font-semibold">Owner is the rider</span>{' '}
            <span className="text-fa-muted">(uncheck to enter someone else)</span>
          </span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {field('ownerName', 'Owner name', { className: 'sm:col-span-2', maxLength: 200 })}
          {field('ownerEmail', 'Owner email', { type: 'email', maxLength: 120 })}
          {field('ownerUsef', 'Owner USEF number', {
            inputMode: 'numeric',
            placeholder: 'or choose a reason ▸',
            maxLength: 20,
          })}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`ownerUsefExemptReason-${horse.id}`}>No USEF number — reason</Label>
            <select
              id={`ownerUsefExemptReason-${horse.id}`}
              className={NATIVE_SELECT_CLASS}
              disabled={reasonDisabled}
              value={shown.ownerUsefExemptReason}
              onChange={(event) => {
                setField('ownerUsefExemptReason', event.target.value);
              }}
            >
              <option value=""> </option>
              <option value={USEF_EXEMPT_REASON_EX}>
                EX · Exempt class (e.g. Leadline, Walk-Trot)
              </option>
            </select>
          </div>
          {field('ownerStreet', 'Street address', { className: 'sm:col-span-3', maxLength: 150 })}
          {field('ownerCity', 'City', { maxLength: 50 })}
          {field('ownerState', 'State', { maxLength: 2 })}
          {field('ownerZip', 'ZIP', { maxLength: 10 })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-forest text-xs font-semibold tracking-wide uppercase">Trainer</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {field('trainer', 'Trainer name', { maxLength: 200 })}
          {field('trainerUsef', 'Trainer USEF number', { inputMode: 'numeric', maxLength: 20 })}
          {field('trainerPhone', 'Trainer phone', { type: 'tel', maxLength: 30 })}
          {field('trainerStreet', 'Street address', { className: 'sm:col-span-3', maxLength: 150 })}
          {field('trainerCity', 'City', { maxLength: 50 })}
          {field('trainerState', 'State', { maxLength: 2 })}
          {field('trainerZip', 'ZIP', { maxLength: 10 })}
        </div>
      </div>

      <p className="text-fa-muted text-xs">
        Only your show&apos;s organizer and staff you&apos;ve entered shows with can see this. USEF
        requires it on rated-show results; for schooling shows you can leave it blank.
      </p>

      <div className="flex items-center gap-3">
        <Button type="button" disabled={updateHorse.isPending} onClick={save}>
          {updateHorse.isPending ? 'Saving…' : 'Save USEF details'}
        </Button>
        {saved && <span className="text-fa-muted text-xs">Saved.</span>}
      </div>
    </div>
  );
}

interface FieldOptions {
  className?: string;
  type?: string;
  inputMode?: 'numeric';
  placeholder?: string;
  maxLength?: number;
}
