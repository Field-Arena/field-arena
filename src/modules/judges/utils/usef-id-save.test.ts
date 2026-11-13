import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideUsefIdSave } from './usef-id-save';

describe('decideUsefIdSave', () => {
  it('refuses anything that is not numbers', () => {
    const d = decideUsefIdSave('44a17', null);
    assert.equal(d.action, 'invalid');
  });

  it('does nothing when the value has not changed (spaces are ignored)', () => {
    assert.deepEqual(decideUsefIdSave(' 4417720 ', '4417720'), { action: 'unchanged' });
    assert.deepEqual(decideUsefIdSave('', null), { action: 'unchanged' });
  });

  it('saves a new or corrected value', () => {
    assert.deepEqual(decideUsefIdSave('4417720', null), { action: 'save', value: '4417720' });
    assert.deepEqual(decideUsefIdSave('4417721', '4417720'), { action: 'save', value: '4417721' });
  });

  it('lets a blank through so a judge can clear a wrong ID', () => {
    assert.deepEqual(decideUsefIdSave('', '4417720'), { action: 'save', value: '' });
  });
});
