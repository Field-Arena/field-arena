'use client';

import { useState } from 'react';
import { USEF_EXEMPT_REASON_EX, horseUsefDetailsSchema } from '@/modules/riders/schemas';
import type { HorseUsefValues } from '@/modules/riders/utils/horse-usef';
import { stampPill } from '@/modules/riders/utils/horse-usef-meta';
import { COLUMN_FOR_FIELD } from '@/modules/riders/utils/horse-usef-updates';
import type { HorseUsefSnapshot } from '@/modules/shows/data/horses-queries';
import { useUpdateHorseUsefDetails } from '@/modules/shows/hooks/use-horses-mutations';
import {
  FA_BTN_PRIMARY,
  FA_INPUT,
  FA_SELECT,
  FaCard,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { cn } from '@/shared/lib/utils';

type FieldKey = keyof HorseUsefValues;

const PILL_TONE: Record<'blue' | 'grey' | 'green', PillTone> = {
  blue: 'blue',
  grey: 'grey',
  green: 'green',
};

interface FieldSpec {
  key: FieldKey;
  label: string;
  span?: 2 | 4;
  inputMode?: 'numeric';
  type?: string;
  placeholder?: string;
  maxLength?: number;
}

const HORSE_FIELDS: FieldSpec[] = [
  { key: 'usefNumber', label: 'Horse USEF number', inputMode: 'numeric', maxLength: 20 },
  { key: 'feiNumber', label: 'FEI number', placeholder: 'optional', maxLength: 20 },
  { key: 'passportNumber', label: 'Passport number', placeholder: 'FEI only', maxLength: 20 },
  { key: 'registrationNumber', label: 'Breed registration number', maxLength: 50 },
  { key: 'yearOfBirth', label: 'Year of birth', inputMode: 'numeric', maxLength: 4 },
  { key: 'breed', label: 'Breed', maxLength: 50 },
];

const OWNER_FIELDS: FieldSpec[] = [
  { key: 'ownerName', label: 'Owner name', span: 2, maxLength: 200 },
  { key: 'ownerEmail', label: 'Owner email', type: 'email', span: 2, maxLength: 120 },
  { key: 'ownerUsef', label: 'Owner USEF number', inputMode: 'numeric', maxLength: 20 },
  // ownerUsefExemptReason is rendered as a select below.
  { key: 'ownerStreet', label: 'Street address', span: 4, maxLength: 150 },
  { key: 'ownerCity', label: 'City', maxLength: 50 },
  { key: 'ownerState', label: 'State', maxLength: 2 },
  { key: 'ownerZip', label: 'ZIP', maxLength: 10 },
];

const TRAINER_FIELDS: FieldSpec[] = [
  { key: 'trainer', label: 'Trainer name', span: 2, maxLength: 200 },
  { key: 'trainerUsef', label: 'Trainer USEF number', inputMode: 'numeric', maxLength: 20 },
  { key: 'trainerPhone', label: 'Trainer phone', type: 'tel', maxLength: 30 },
  { key: 'trainerStreet', label: 'Street address', span: 4, maxLength: 150 },
  { key: 'trainerCity', label: 'City', maxLength: 50 },
  { key: 'trainerState', label: 'State', maxLength: 2 },
  { key: 'trainerZip', label: 'ZIP', maxLength: 10 },
];

const SPAN: Record<2 | 4, string> = { 2: 'sm:col-span-2', 4: 'sm:col-span-4' };

/* The organizer's card for a horse's USEF details: the same fields the rider
 * fills in, each tagged with who last set it. Saving changes the horse for every
 * show it is in, and the rider sees what was changed. */
export function HorseUsefCard({
  horseId,
  horseName,
  usef,
  viewerId,
}: {
  horseId: string;
  horseName: string;
  usef: HorseUsefSnapshot;
  viewerId: string | null;
}) {
  const [values, setValues] = useState<HorseUsefValues>(usef.values);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saved, setSaved] = useState(false);
  const [now] = useState(() => new Date());
  const save = useUpdateHorseUsefDetails({
    onSuccess: () => {
      setSaved(true);
    },
  });

  function set(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function pillFor(key: FieldKey) {
    const stamp = usef.meta[COLUMN_FOR_FIELD[key]];
    const pill = stampPill(stamp, viewerId, now);
    if (!pill) return null;
    return (
      <Pill tone={PILL_TONE[pill.tone]} className="ml-1.5 align-middle">
        {pill.label}
      </Pill>
    );
  }

  function field(spec: FieldSpec) {
    const id = `usef-${spec.key}-${horseId}`;
    const edited = values[spec.key] !== usef.values[spec.key];
    return (
      <div key={spec.key} className={spec.span ? SPAN[spec.span] : undefined}>
        <label htmlFor={id} className="mb-1 block text-[12px] font-bold text-[#3F4F48]">
          {spec.label}
          {pillFor(spec.key)}
        </label>
        <input
          id={id}
          type={spec.type}
          inputMode={spec.inputMode}
          placeholder={spec.placeholder}
          maxLength={spec.maxLength}
          aria-invalid={errors[spec.key] ? true : undefined}
          className={cn(FA_INPUT, 'w-full', edited && 'border-[#1A5B3C]')}
          value={values[spec.key]}
          onChange={(event) => {
            set(spec.key, event.target.value);
          }}
        />
        {errors[spec.key] && (
          <p className="mt-1 text-[12px] font-semibold text-[#98341F]">{errors[spec.key]}</p>
        )}
      </div>
    );
  }

  function onSave() {
    const input = { horseId, ...values };
    const result = horseUsefDetailsSchema.safeParse(input);
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
    save.mutate(input);
  }

  const reasonId = `usef-ownerUsefExemptReason-${horseId}`;
  const reasonDisabled = values.ownerUsef.trim() !== '';

  return (
    <FaCard tone="live" className="mt-3 p-[16px_18px]">
      <h3 className="font-[family-name:var(--ws-fraunces)] text-[13px] font-bold tracking-[.06em] text-[#5A6B63] uppercase">
        For USEF results — organizer can edit
      </h3>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">{HORSE_FIELDS.map(field)}</div>

      <h4 className="mt-4 mb-2 text-[12px] font-extrabold tracking-[.06em] text-[#5A6B63] uppercase">
        Owner
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {OWNER_FIELDS.slice(0, 3).map(field)}
        <div className="sm:col-span-1">
          <label htmlFor={reasonId} className="mb-1 block text-[12px] font-bold text-[#3F4F48]">
            No USEF number — reason
            {pillFor('ownerUsefExemptReason')}
          </label>
          <select
            id={reasonId}
            disabled={reasonDisabled}
            className={cn(FA_SELECT, 'w-full')}
            value={reasonDisabled ? '' : values.ownerUsefExemptReason}
            onChange={(event) => {
              set('ownerUsefExemptReason', event.target.value);
            }}
          >
            <option value="">—</option>
            <option value={USEF_EXEMPT_REASON_EX}>EX · Exempt class</option>
          </select>
        </div>
        {OWNER_FIELDS.slice(3).map(field)}
      </div>

      <h4 className="mt-4 mb-2 text-[12px] font-extrabold tracking-[.06em] text-[#5A6B63] uppercase">
        Trainer
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">{TRAINER_FIELDS.map(field)}</div>

      <p className="mt-3 text-[12.5px] font-semibold text-[#5A6B63]">
        Each value shows who entered it. Saving changes {horseName} everywhere: the rider sees it on
        their horse (marked as updated by you) and it carries into future shows. You can only edit
        horses entered in your show.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" disabled={save.isPending} onClick={onSave} className={FA_BTN_PRIMARY}>
          {save.isPending ? 'Saving…' : 'Save USEF details'}
        </button>
        {saved && <span className="text-[13px] font-semibold text-[#1A5B3C]">Saved.</span>}
      </div>
    </FaCard>
  );
}
