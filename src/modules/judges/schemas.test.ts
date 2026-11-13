import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createJudgeSchema, updateJudgeSchema, usefIdSchema } from './schemas';

describe('usefIdSchema', () => {
  it('accepts digits and blank, rejects anything else', () => {
    assert.equal(usefIdSchema.parse('4417720'), '4417720');
    assert.equal(usefIdSchema.parse(''), '');
    assert.equal(usefIdSchema.safeParse('44-17').success, false);
    assert.equal(usefIdSchema.safeParse('abc').success, false);
  });
});

describe('createJudgeSchema', () => {
  const ok = { firstName: 'Kara', lastName: 'Moore', email: ' KARA@Example.com ' };

  it('normalizes the email and defaults the optional fields', () => {
    const parsed = createJudgeSchema.parse(ok);
    assert.equal(parsed.email, 'kara@example.com');
    assert.equal(parsed.usefId, '');
    assert.equal(parsed.phone, '');
  });

  it('requires a name and an email', () => {
    assert.equal(createJudgeSchema.safeParse({ ...ok, firstName: '' }).success, false);
    assert.equal(createJudgeSchema.safeParse({ ...ok, lastName: ' ' }).success, false);
    assert.equal(createJudgeSchema.safeParse({ ...ok, email: '' }).success, false);
  });

  it('update needs an id', () => {
    assert.equal(updateJudgeSchema.safeParse(ok).success, false);
    assert.equal(
      updateJudgeSchema.safeParse({ ...ok, id: '3f1c1ef2-6f5f-4a52-8b0e-0f9f2a3b4c5d' }).success,
      true,
    );
  });
});
