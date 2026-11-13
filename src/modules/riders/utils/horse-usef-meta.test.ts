import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  USEF_META_FIELDS,
  canSyncOverwrite,
  changedUsefFields,
  decideHorseEditAccess,
  formatStampTime,
  organizerChangeNote,
  parseUsefMeta,
  stampChangedFields,
  stampPill,
  type UsefFieldMeta,
  type UsefFieldStamp,
} from '@/modules/riders/utils/horse-usef-meta';

const NOW = new Date('2026-11-13T15:30:00.000Z');

const riderStamp: UsefFieldStamp = {
  source: 'rider',
  by: 'Pat Moore',
  byId: 'rider-1',
  at: '2026-11-12T10:00:00.000Z',
};
const organizerStamp: UsefFieldStamp = {
  source: 'organizer',
  by: 'Dana Lee',
  byId: 'org-1',
  at: '2026-11-13T15:02:00.000Z',
};

test('tracks the 19 USEF columns plus trainer name and phone', () => {
  assert.equal(USEF_META_FIELDS.length, 21);
  assert.equal(new Set(USEF_META_FIELDS).size, 21);
  assert.ok(USEF_META_FIELDS.includes('owner_usef_exempt_reason'));
  assert.ok(USEF_META_FIELDS.includes('trainer'));
});

test('parseUsefMeta keeps valid entries and drops malformed ones', () => {
  const meta = parseUsefMeta({
    usef_number: { ...riderStamp },
    breed: { source: 'wizard', by: 'x', at: '2026-11-12T10:00:00.000Z' },
    owner_name: { source: 'rider', by: 'x', at: 'not a date' },
    not_a_field: { ...riderStamp },
    trainer: 'oops',
  });
  assert.deepEqual(Object.keys(meta), ['usef_number']);
  assert.equal(meta.usef_number?.by, 'Pat Moore');
});

test('parseUsefMeta tolerates non-objects', () => {
  assert.deepEqual(parseUsefMeta(null), {});
  assert.deepEqual(parseUsefMeta([]), {});
  assert.deepEqual(parseUsefMeta('x'), {});
  assert.deepEqual(parseUsefMeta(undefined), {});
});

test('changedUsefFields ignores unchanged values and whitespace/null differences', () => {
  const changed = changedUsefFields(
    { usef_number: '123', breed: null, owner_name: 'Carol ' },
    { usef_number: '123', breed: '', owner_name: 'Carol', owner_zip: '29801' },
  );
  assert.deepEqual(changed, ['owner_zip']);
});

test('changedUsefFields only looks at fields that were sent', () => {
  assert.deepEqual(changedUsefFields({ usef_number: '123' }, {}), []);
});

test('stampChangedFields stamps only what changed and keeps other stamps', () => {
  const meta: UsefFieldMeta = { usef_number: riderStamp, breed: organizerStamp };
  const next = stampChangedFields(
    { usef_number: '123', breed: 'KWPN', owner_usef: null },
    { usef_number: '123', breed: 'KWPN', owner_usef: '6102233' },
    meta,
    organizerStamp,
  );
  assert.equal(next.usef_number?.source, 'rider');
  assert.equal(next.breed?.at, organizerStamp.at);
  assert.equal(next.owner_usef?.source, 'organizer');
  assert.equal(next.owner_usef.by, 'Dana Lee');
});

test('a rider re-saving untouched values does not wipe an organizer note', () => {
  const meta: UsefFieldMeta = { owner_usef: organizerStamp };
  const next = stampChangedFields({ owner_usef: '6102233' }, { owner_usef: '6102233' }, meta, {
    ...riderStamp,
    at: NOW.toISOString(),
  });
  assert.equal(next.owner_usef?.source, 'organizer');
});

test('a rider overwriting an organizer value takes over the stamp', () => {
  const meta: UsefFieldMeta = { owner_usef: organizerStamp };
  const next = stampChangedFields({ owner_usef: '6102233' }, { owner_usef: '7000000' }, meta, {
    ...riderStamp,
    at: NOW.toISOString(),
  });
  assert.equal(next.owner_usef?.source, 'rider');
});

test('stampChangedFields does not mutate its input', () => {
  const meta: UsefFieldMeta = { usef_number: riderStamp };
  stampChangedFields({ usef_number: '1' }, { usef_number: '2' }, meta, organizerStamp);
  assert.equal(meta.usef_number?.source, 'rider');
});

test('only an empty value or a USEF-sourced one may be overwritten by a sync', () => {
  const meta: UsefFieldMeta = {
    usef_number: riderStamp,
    owner_usef: { ...riderStamp, source: 'usef', by: 'USEF', byId: null },
  };
  assert.equal(canSyncOverwrite(meta, 'usef_number', '5240871'), false);
  assert.equal(canSyncOverwrite(meta, 'owner_usef', '6102233'), true);
  assert.equal(canSyncOverwrite(meta, 'breed', '   '), true);
  // A value with no stamp at all (entered before tracking existed) is not USEF's.
  assert.equal(canSyncOverwrite(meta, 'fei_number', '999'), false);
});

test('decideHorseEditAccess', () => {
  assert.equal(decideHorseEditAccess([]), 'not-entered');
  assert.equal(decideHorseEditAccess([{ allowed: false }, { allowed: false }]), 'denied');
  assert.equal(decideHorseEditAccess([{ allowed: false }, { allowed: true }]), 'allowed');
});

test('formatStampTime says "today" with the time, or the date for earlier days', () => {
  assert.equal(formatStampTime('2026-11-13T15:02:00.000Z', NOW, 'UTC'), 'today 3:02 PM');
  assert.equal(formatStampTime('2026-11-12T23:59:00.000Z', NOW, 'UTC'), 'Nov 12');
  assert.equal(formatStampTime('garbage', NOW, 'UTC'), '');
});

test('formatStampTime respects the time zone for "today"', () => {
  // 02:00 UTC on the 13th is still the 12th in New York.
  assert.equal(formatStampTime('2026-11-13T02:00:00.000Z', NOW, 'America/New_York'), 'Nov 12');
});

test('stampPill for the organizer card', () => {
  assert.equal(stampPill(undefined, 'org-1', NOW, 'UTC'), null);
  assert.deepEqual(stampPill(riderStamp, 'org-1', NOW, 'UTC'), { label: 'rider', tone: 'blue' });
  assert.deepEqual(stampPill(organizerStamp, 'org-1', NOW, 'UTC'), {
    label: 'you · today 3:02 PM',
    tone: 'grey',
  });
  assert.deepEqual(stampPill(organizerStamp, 'someone-else', NOW, 'UTC'), {
    label: 'Dana Lee · today 3:02 PM',
    tone: 'grey',
  });
  assert.deepEqual(
    stampPill({ ...riderStamp, source: 'usef', by: 'USEF', byId: null }, null, NOW, 'UTC'),
    { label: 'verified by USEF', tone: 'green' },
  );
});

test('organizerChangeNote only speaks about organizer changes', () => {
  assert.equal(
    organizerChangeNote(organizerStamp, NOW, 'UTC'),
    'Updated by organizer today 3:02 PM',
  );
  assert.equal(organizerChangeNote(riderStamp, NOW, 'UTC'), null);
  assert.equal(organizerChangeNote(undefined, NOW, 'UTC'), null);
});
