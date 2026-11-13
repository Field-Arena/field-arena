import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateStaffDetailsSchema } from './schemas';

const base = {
  staffId: '3f2b7c1e-5a4d-4e8f-9b6a-1c2d3e4f5a6b',
  firstName: 'Pat',
  lastName: 'Reed',
  email: 'pat@example.com',
};

test('the USEF ID is optional, so existing edits keep working', () => {
  const parsed = updateStaffDetailsSchema.parse(base);
  assert.equal(parsed.usefId, undefined);
});

test('a USEF ID is numbers only and trimmed', () => {
  assert.equal(updateStaffDetailsSchema.parse({ ...base, usefId: ' 5551234 ' }).usefId, '5551234');
  assert.equal(updateStaffDetailsSchema.safeParse({ ...base, usefId: '55-12A' }).success, false);
});

test('an empty USEF ID is allowed, so it can be cleared', () => {
  assert.equal(updateStaffDetailsSchema.parse({ ...base, usefId: '' }).usefId, '');
});

test('an over-long USEF ID is refused', () => {
  assert.equal(
    updateStaffDetailsSchema.safeParse({ ...base, usefId: '1'.repeat(21) }).success,
    false,
  );
});
