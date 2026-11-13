import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { JudgeListItem } from '@/modules/judges/types';
import {
  formatChangedAt,
  isUpcomingShow,
  judgeStats,
  normalizeUsefId,
  usefIdSourceInfo,
} from './judge-display';

const base = {
  usefId: '4417720',
  usefIdSource: 'manual',
  usefIdEnteredBy: null,
  usefIdVerifiedAt: null,
};

describe('usefIdSourceInfo', () => {
  it('flags a missing ID', () => {
    const info = usefIdSourceInfo({ ...base, usefId: null });
    assert.equal(info.label, 'needed for USEF export');
    assert.equal(info.tone, 'yellow');
  });

  it('says who typed it', () => {
    assert.equal(usefIdSourceInfo({ ...base, usefIdEnteredBy: 'judge' }).label, 'typed by judge');
    assert.equal(
      usefIdSourceInfo({ ...base, usefIdEnteredBy: 'organizer' }).label,
      'typed by organizer',
    );
    assert.equal(usefIdSourceInfo(base).label, 'typed by hand');
  });

  it('reserves the green labels for USEF-sourced values', () => {
    assert.equal(
      usefIdSourceInfo({ ...base, usefIdVerifiedAt: '2026-11-01T00:00:00Z' }).label,
      'verified by USEF',
    );
    assert.equal(usefIdSourceInfo({ ...base, usefIdSource: 'usef' }).label, 'from USEF');
  });
});

describe('judgeStats', () => {
  const judge = (usefId: string | null, upcoming: boolean[]): JudgeListItem => ({
    id: 'x',
    firstName: '',
    lastName: '',
    name: 'J',
    email: null,
    phone: null,
    usefId,
    usefIdSource: null,
    usefIdEnteredBy: null,
    usefIdVerifiedAt: null,
    usefIdUpdatedAt: null,
    shows: upcoming.map((u, i) => ({ id: String(i), name: 'S', upcoming: u })),
  });

  it('counts judges with and without an ID, and those in an upcoming show', () => {
    const stats = judgeStats([judge('1', [true]), judge(null, [false]), judge('2', [])]);
    assert.deepEqual(stats, { total: 3, withUsefId: 2, missingUsefId: 1, inUpcomingShow: 1 });
  });

  it('handles an empty list', () => {
    assert.deepEqual(judgeStats([]), {
      total: 0,
      withUsefId: 0,
      missingUsefId: 0,
      inUpcomingShow: 0,
    });
  });
});

describe('isUpcomingShow', () => {
  it('stays upcoming through the last day of the show', () => {
    assert.equal(isUpcomingShow({ startDate: '2026-11-10', endDate: '2026-11-12' }, '2026-11-12'), true);
    assert.equal(isUpcomingShow({ startDate: '2026-11-10', endDate: '2026-11-12' }, '2026-11-13'), false);
  });

  it('uses the start date when there is no end date, and treats undated shows as upcoming', () => {
    assert.equal(isUpcomingShow({ startDate: '2026-11-10', endDate: null }, '2026-11-11'), false);
    assert.equal(isUpcomingShow({ startDate: null, endDate: null }, '2026-11-11'), true);
  });
});

describe('normalizeUsefId', () => {
  it('turns blank into null and keeps digits', () => {
    assert.equal(normalizeUsefId('  '), null);
    assert.equal(normalizeUsefId(null), null);
    assert.equal(normalizeUsefId(' 4417720 '), '4417720');
  });
});

describe('formatChangedAt', () => {
  const now = new Date(2026, 10, 13, 15, 0, 0);

  it('says today / yesterday / a date', () => {
    assert.match(formatChangedAt(new Date(2026, 10, 13, 9, 14).toISOString(), now) ?? '', /^today 9:14 AM$/);
    assert.match(formatChangedAt(new Date(2026, 10, 12, 16, 2).toISOString(), now) ?? '', /^yesterday 4:02 PM$/);
    assert.match(formatChangedAt(new Date(2026, 10, 3, 14, 30).toISOString(), now) ?? '', /^Nov 3, 2:30 PM$/);
  });

  it('returns null for nothing or garbage', () => {
    assert.equal(formatChangedAt(null, now), null);
    assert.equal(formatChangedAt('not a date', now), null);
  });
});
