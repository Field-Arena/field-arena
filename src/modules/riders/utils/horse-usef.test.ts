import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  horseToUsefValues,
  isOwnerRider,
  ownerFromRider,
  resolveOwnerValues,
  type RiderOwnerSource,
} from '@/modules/riders/utils/horse-usef';
import type { HorseWithDocumentUrls } from '@/modules/riders/types';

const rider: RiderOwnerSource = {
  first_name: 'Carol',
  last_name: 'Walker',
  email: 'carol@example.com',
  street: '1200 Whiskey Rd',
  city: 'Aiken',
  state: 'sc',
  zip: '29801',
  usef: '1234567',
};

function horse(overrides: Partial<HorseWithDocumentUrls> = {}): HorseWithDocumentUrls {
  return {
    id: 'h1',
    rider_id: 'r1',
    name: 'Juniper M',
    stable: null,
    trainer: null,
    trainer_phone: null,
    height: null,
    farrier: null,
    is_stallion: null,
    usef_number: null,
    fei_number: null,
    passport_number: null,
    registration_number: null,
    year_of_birth: null,
    breed: null,
    owner_name: null,
    owner_email: null,
    owner_usef: null,
    owner_usef_exempt_reason: null,
    owner_street: null,
    owner_city: null,
    owner_state: null,
    owner_zip: null,
    trainer_usef: null,
    trainer_street: null,
    trainer_city: null,
    trainer_state: null,
    trainer_zip: null,
    created_at: '2026-01-01',
    documentUploads: [],
    ...overrides,
  };
}

test('ownerFromRider builds the owner from the rider profile', () => {
  assert.deepEqual(ownerFromRider(rider), {
    ownerName: 'Carol Walker',
    ownerEmail: 'carol@example.com',
    ownerUsef: '1234567',
    ownerUsefExemptReason: '',
    ownerStreet: '1200 Whiskey Rd',
    ownerCity: 'Aiken',
    ownerState: 'SC',
    ownerZip: '29801',
  });
});

test('ownerFromRider tolerates a missing last name and blanks', () => {
  const owner = ownerFromRider({
    ...rider,
    last_name: null,
    street: null,
    usef: null,
  });
  assert.equal(owner.ownerName, 'Carol');
  assert.equal(owner.ownerStreet, '');
  assert.equal(owner.ownerUsef, '');
});

test('owner-is-rider defaults on when the horse has no owner saved', () => {
  assert.equal(isOwnerRider(horse(), rider), true);
});

test('owner-is-rider defaults on when the saved owner equals the rider profile', () => {
  const saved = horse({
    owner_name: 'carol walker',
    owner_email: 'Carol@Example.com',
    owner_usef: '1234567',
    owner_street: '1200 Whiskey Rd',
    owner_city: 'Aiken',
    owner_state: 'SC',
    owner_zip: '29801',
  });
  assert.equal(isOwnerRider(saved, rider), true);
});

test('owner-is-rider defaults off when someone else is the saved owner', () => {
  assert.equal(isOwnerRider(horse({ owner_name: 'Pat Smith' }), rider), false);
});

test('resolveOwnerValues uses the rider profile when ticked', () => {
  const entered = horseToUsefValues(horse({ owner_name: 'Pat Smith' }));
  assert.equal(resolveOwnerValues(true, entered, rider).ownerName, 'Carol Walker');
  assert.equal(resolveOwnerValues(false, entered, rider).ownerName, 'Pat Smith');
});

test('an entered owner USEF number clears the exempt reason', () => {
  const entered = {
    ...horseToUsefValues(horse()),
    ownerUsef: '555',
    ownerUsefExemptReason: 'EX',
  };
  assert.equal(resolveOwnerValues(false, entered, rider).ownerUsefExemptReason, '');
  const noNumber = { ...entered, ownerUsef: '' };
  assert.equal(resolveOwnerValues(false, noNumber, rider).ownerUsefExemptReason, 'EX');
});
