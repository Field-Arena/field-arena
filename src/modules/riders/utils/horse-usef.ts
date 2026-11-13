import { USEF_EXEMPT_REASON_EX } from '@/modules/riders/schemas';
import type { HorseWithDocumentUrls } from '@/modules/riders/types';

export interface RiderOwnerSource {
  first_name: string | null;
  last_name: string | null;
  email: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  usef: string | null;
}

export interface HorseOwnerValues {
  ownerName: string;
  ownerEmail: string;
  ownerUsef: string;
  ownerUsefExemptReason: string;
  ownerStreet: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
}

export interface HorseUsefValues extends HorseOwnerValues {
  usefNumber: string;
  feiNumber: string;
  passportNumber: string;
  registrationNumber: string;
  yearOfBirth: string;
  breed: string;
  trainer: string;
  trainerPhone: string;
  trainerUsef: string;
  trainerStreet: string;
  trainerCity: string;
  trainerState: string;
  trainerZip: string;
}

type HorseUsefSource = Pick<
  HorseWithDocumentUrls,
  | 'usef_number'
  | 'fei_number'
  | 'passport_number'
  | 'registration_number'
  | 'year_of_birth'
  | 'breed'
  | 'owner_name'
  | 'owner_email'
  | 'owner_usef'
  | 'owner_usef_exempt_reason'
  | 'owner_street'
  | 'owner_city'
  | 'owner_state'
  | 'owner_zip'
  | 'trainer'
  | 'trainer_phone'
  | 'trainer_usef'
  | 'trainer_street'
  | 'trainer_city'
  | 'trainer_state'
  | 'trainer_zip'
>;

export function ownerFromRider(rider: RiderOwnerSource): HorseOwnerValues {
  const usef = (rider.usef ?? '').trim();
  return {
    ownerName: [rider.first_name, rider.last_name]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(' '),
    ownerEmail: rider.email.trim(),
    ownerUsef: usef,
    ownerUsefExemptReason: '',
    ownerStreet: (rider.street ?? '').trim(),
    ownerCity: (rider.city ?? '').trim(),
    ownerState: (rider.state ?? '').trim().toUpperCase(),
    ownerZip: (rider.zip ?? '').trim(),
  };
}

export function horseOwnerValues(horse: HorseUsefSource): HorseOwnerValues {
  return {
    ownerName: horse.owner_name ?? '',
    ownerEmail: horse.owner_email ?? '',
    ownerUsef: horse.owner_usef ?? '',
    ownerUsefExemptReason: horse.owner_usef_exempt_reason ?? '',
    ownerStreet: horse.owner_street ?? '',
    ownerCity: horse.owner_city ?? '',
    ownerState: horse.owner_state ?? '',
    ownerZip: horse.owner_zip ?? '',
  };
}

export function horseToUsefValues(horse: HorseUsefSource): HorseUsefValues {
  return {
    ...horseOwnerValues(horse),
    usefNumber: horse.usef_number ?? '',
    feiNumber: horse.fei_number ?? '',
    passportNumber: horse.passport_number ?? '',
    registrationNumber: horse.registration_number ?? '',
    yearOfBirth: horse.year_of_birth ?? '',
    breed: horse.breed ?? '',
    trainer: horse.trainer ?? '',
    trainerPhone: horse.trainer_phone ?? '',
    trainerUsef: horse.trainer_usef ?? '',
    trainerStreet: horse.trainer_street ?? '',
    trainerCity: horse.trainer_city ?? '',
    trainerState: horse.trainer_state ?? '',
    trainerZip: horse.trainer_zip ?? '',
  };
}

const OWNER_KEYS = [
  'ownerName',
  'ownerEmail',
  'ownerUsef',
  'ownerStreet',
  'ownerCity',
  'ownerState',
  'ownerZip',
] as const;

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

/** True when the horse has no owner saved yet, or the saved owner is the rider. */
export function isOwnerRider(horse: HorseUsefSource, rider: RiderOwnerSource): boolean {
  const saved = horseOwnerValues(horse);
  const hasSavedOwner = [...OWNER_KEYS, 'ownerUsefExemptReason' as const].some(
    (key) => saved[key].trim() !== '',
  );
  if (!hasSavedOwner) return true;
  const fromRider = ownerFromRider(rider);
  return OWNER_KEYS.every((key) => normalized(saved[key]) === normalized(fromRider[key]));
}

/** The owner values to show and save: the rider's profile when the box is ticked. */
export function resolveOwnerValues(
  ownerIsRider: boolean,
  entered: HorseOwnerValues,
  rider: RiderOwnerSource,
): HorseOwnerValues {
  const owner = ownerIsRider ? ownerFromRider(rider) : entered;
  return {
    ...owner,
    ownerUsefExemptReason:
      owner.ownerUsef.trim() === '' && owner.ownerUsefExemptReason === USEF_EXEMPT_REASON_EX
        ? USEF_EXEMPT_REASON_EX
        : '',
  };
}
