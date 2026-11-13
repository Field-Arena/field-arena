import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horseUpdateSchema } from '@/modules/riders/schemas';

const ID = '3f2b8c1e-8a4d-4c55-9a53-0d1f0c1d2e3f';

function parse(fields: Record<string, unknown>) {
  return horseUpdateSchema.safeParse({ id: ID, ...fields });
}

test('empty and whitespace values become null', () => {
  const result = parse({ usefNumber: '  ', breed: '', ownerEmail: '', yearOfBirth: '' });
  assert.ok(result.success);
  assert.equal(result.data.usefNumber, null);
  assert.equal(result.data.breed, null);
  assert.equal(result.data.ownerEmail, null);
  assert.equal(result.data.yearOfBirth, null);
});

test('omitted fields stay undefined', () => {
  const result = parse({});
  assert.ok(result.success);
  assert.equal(result.data.usefNumber, undefined);
});

test('USEF numbers are digits only', () => {
  for (const key of ['usefNumber', 'ownerUsef', 'trainerUsef']) {
    const bad = parse({ [key]: '12ab' });
    assert.ok(!bad.success);
    assert.equal(bad.error.issues[0]?.message, 'Numbers only');
    const good = parse({ [key]: ' 5240871 ' });
    assert.ok(good.success);
    assert.equal(good.data[key as 'usefNumber'], '5240871');
  }
});

test('USEF numbers are capped at 20 digits', () => {
  assert.ok(!parse({ usefNumber: '1'.repeat(21) }).success);
  assert.ok(parse({ usefNumber: '1'.repeat(20) }).success);
});

test('year of birth is four digits or empty', () => {
  assert.ok(parse({ yearOfBirth: '2016' }).success);
  assert.ok(!parse({ yearOfBirth: '16' }).success);
  assert.ok(!parse({ yearOfBirth: '20160' }).success);
  assert.ok(!parse({ yearOfBirth: 'abcd' }).success);
});

test('state is two letters and uppercased', () => {
  const result = parse({ ownerState: ' sc ', trainerState: 'ga' });
  assert.ok(result.success);
  assert.equal(result.data.ownerState, 'SC');
  assert.equal(result.data.trainerState, 'GA');
  assert.ok(!parse({ ownerState: 'South Carolina' }).success);
  assert.ok(!parse({ trainerState: 'S' }).success);
});

test('zip allows up to 10 characters', () => {
  assert.ok(parse({ ownerZip: '29801-1234' }).success);
  assert.ok(!parse({ ownerZip: '29801-12345' }).success);
});

test('owner email must look like an email when present', () => {
  assert.ok(parse({ ownerEmail: 'carol@example.com' }).success);
  assert.ok(!parse({ ownerEmail: 'carol' }).success);
});

test('exempt reason accepts EX or empty only', () => {
  const ex = parse({ ownerUsefExemptReason: 'EX' });
  assert.ok(ex.success);
  assert.equal(ex.data.ownerUsefExemptReason, 'EX');
  const blank = parse({ ownerUsefExemptReason: '' });
  assert.ok(blank.success);
  assert.equal(blank.data.ownerUsefExemptReason, null);
  assert.ok(!parse({ ownerUsefExemptReason: 'XX' }).success);
});

test('breed registration allows up to 50 characters, others 20', () => {
  assert.ok(parse({ registrationNumber: 'K'.repeat(50) }).success);
  assert.ok(!parse({ registrationNumber: 'K'.repeat(51) }).success);
  assert.ok(!parse({ passportNumber: 'P'.repeat(21) }).success);
});
