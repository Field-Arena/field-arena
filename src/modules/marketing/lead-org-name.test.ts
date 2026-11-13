import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeLikePattern, leadOrgName, repeatRequestNote } from './lead-org-name';

test('a barn name is used as typed, trimmed', () => {
  assert.equal(leadOrgName('  Meadowbrook Equestrian ', 'Pat Moore'), 'Meadowbrook Equestrian');
});

test('no barn: the lead is filed under the person', () => {
  assert.equal(leadOrgName('', 'Pat Moore'), 'Pat Moore (independent)');
  assert.equal(leadOrgName('   ', ' Pat Moore '), 'Pat Moore (independent)');
  assert.equal(leadOrgName(undefined, 'Pat Moore'), 'Pat Moore (independent)');
});

test('wildcard characters in a name are matched literally', () => {
  assert.equal(escapeLikePattern('50% Off_Farm'), '50\\% Off\\_Farm');
  assert.equal(escapeLikePattern('plain'), 'plain');
  assert.equal(escapeLikePattern('a\\b'), 'a\\\\b');
});

test('a repeat request note carries who, when and what', () => {
  const note = repeatRequestNote({
    receivedOn: '2026-11-13',
    contactName: 'Sam Lee',
    email: 'sam@example.com',
    details: 'Discipline: Dressage',
  });
  assert.match(note, /Another request on 2026-11-13 from Sam Lee <sam@example\.com>/);
  assert.match(note, /Discipline: Dressage/);
});
