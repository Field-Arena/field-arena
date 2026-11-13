import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USEF_META_FIELDS } from '@/modules/riders/utils/horse-usef-meta';
import { FIELD_FOR_COLUMN, usefColumnUpdates } from '@/modules/riders/utils/horse-usef-updates';

test('every tracked column has a form field and back', () => {
  for (const column of USEF_META_FIELDS) assert.ok(FIELD_FOR_COLUMN[column], column);
});

test('only the fields that were sent are written, under their column names', () => {
  assert.deepEqual(usefColumnUpdates({ usefNumber: '5240871', breed: null }), {
    usef_number: '5240871',
    breed: null,
  });
  assert.deepEqual(usefColumnUpdates({}), {});
});

test('an owner USEF number clears the "no USEF number" reason', () => {
  assert.equal(
    usefColumnUpdates({ ownerUsef: '6102233', ownerUsefExemptReason: 'EX' })
      .owner_usef_exempt_reason,
    null,
  );
});

test('with no owner USEF number the reason is kept', () => {
  assert.equal(
    usefColumnUpdates({ ownerUsef: null, ownerUsefExemptReason: 'EX' }).owner_usef_exempt_reason,
    'EX',
  );
});

test('the reason is left alone when it was not sent', () => {
  assert.ok(!('owner_usef_exempt_reason' in usefColumnUpdates({ ownerUsef: '1' })));
});

test('trainer name and phone are tracked too', () => {
  assert.deepEqual(usefColumnUpdates({ trainer: 'Kara Moore', trainerPhone: '(803) 555-0144' }), {
    trainer: 'Kara Moore',
    trainer_phone: '(803) 555-0144',
  });
});
