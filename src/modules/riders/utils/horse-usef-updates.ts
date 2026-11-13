import type { UsefFieldValues, UsefMetaField } from '@/modules/riders/utils/horse-usef-meta';

/* The USEF detail fields as the forms name them (already validated), mapped to
 * the horses columns. Shared by the rider's save and the organizer's save so
 * both write exactly the same way. */
export interface HorseUsefFormFields {
  usefNumber?: string | null;
  feiNumber?: string | null;
  passportNumber?: string | null;
  registrationNumber?: string | null;
  yearOfBirth?: string | null;
  breed?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerUsef?: string | null;
  ownerUsefExemptReason?: string | null;
  ownerStreet?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  trainer?: string;
  trainerPhone?: string;
  trainerUsef?: string | null;
  trainerStreet?: string | null;
  trainerCity?: string | null;
  trainerState?: string | null;
  trainerZip?: string | null;
}

/** The horses column for each form field. */
export const COLUMN_FOR_FIELD: Record<keyof HorseUsefFormFields, UsefMetaField> = {
  usefNumber: 'usef_number',
  feiNumber: 'fei_number',
  passportNumber: 'passport_number',
  registrationNumber: 'registration_number',
  yearOfBirth: 'year_of_birth',
  breed: 'breed',
  ownerName: 'owner_name',
  ownerEmail: 'owner_email',
  ownerUsef: 'owner_usef',
  ownerUsefExemptReason: 'owner_usef_exempt_reason',
  ownerStreet: 'owner_street',
  ownerCity: 'owner_city',
  ownerState: 'owner_state',
  ownerZip: 'owner_zip',
  trainer: 'trainer',
  trainerPhone: 'trainer_phone',
  trainerUsef: 'trainer_usef',
  trainerStreet: 'trainer_street',
  trainerCity: 'trainer_city',
  trainerState: 'trainer_state',
  trainerZip: 'trainer_zip',
};

/** The form-field key for each tracked column (the reverse of the map above). */
export const FIELD_FOR_COLUMN = Object.fromEntries(
  Object.entries(COLUMN_FOR_FIELD).map(([field, column]) => [column, field]),
) as Record<UsefMetaField, keyof HorseUsefFormFields>;

/** Column values to write for the fields that were sent. An owner USEF number and
 *  a "no USEF number" reason are mutually exclusive: the reason is dropped when a
 *  number is present. */
export function usefColumnUpdates(input: HorseUsefFormFields): UsefFieldValues {
  const updates: UsefFieldValues = {};
  for (const field of Object.keys(COLUMN_FOR_FIELD) as (keyof HorseUsefFormFields)[]) {
    const value = input[field];
    if (value !== undefined) updates[COLUMN_FOR_FIELD[field]] = value;
  }
  if (input.ownerUsefExemptReason !== undefined) {
    updates.owner_usef_exempt_reason = updates.owner_usef ? null : input.ownerUsefExemptReason;
  }
  return updates;
}
