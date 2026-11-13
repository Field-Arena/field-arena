import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoRequestSchema } from './schemas';
import { DEMO_DISCIPLINES, DEMO_VOLUMES } from './landing-content';

const base = {
  name: 'Pat Moore',
  email: 'pat@example.com',
  discipline: DEMO_DISCIPLINES[0],
  volume: DEMO_VOLUMES[0],
};

test('the barn or organization is optional', () => {
  assert.equal(demoRequestSchema.safeParse(base).success, true);
  assert.equal(demoRequestSchema.safeParse({ ...base, organization: '' }).success, true);
  assert.equal(demoRequestSchema.safeParse({ ...base, organization: '   ' }).success, true);
});

test('a barn name, when given, is kept and trimmed', () => {
  assert.equal(
    demoRequestSchema.parse({ ...base, organization: ' Meadowbrook ' }).organization,
    'Meadowbrook',
  );
});

test('name and email are still required', () => {
  assert.equal(demoRequestSchema.safeParse({ ...base, name: '' }).success, false);
  assert.equal(demoRequestSchema.safeParse({ ...base, email: 'nope' }).success, false);
});

test('an over-long organization is still refused', () => {
  assert.equal(
    demoRequestSchema.safeParse({ ...base, organization: 'x'.repeat(161) }).success,
    false,
  );
});
