import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeUsefReadiness } from './readiness';
import type { ExportEntry, ExportInput, ExportPerson } from '../types';

const person = (over: Partial<ExportPerson> = {}): ExportPerson => ({
  firstName: null,
  lastName: null,
  fallbackName: null,
  usef: null,
  noUsefReason: null,
  street: null,
  city: null,
  state: null,
  zip: null,
  email: null,
  ...over,
});

const entry = (n: number, over: Partial<ExportEntry> = {}): ExportEntry => ({
  classId: 'c1',
  riderKey: `r${String(n)}`,
  horseKey: `h${String(n)}`,
  num: String(n),
  status: 'scored',
  finalPct: '65',
  rank: n,
  pct: 65,
  riderDivision: 'O',
  judgePct: {},
  testName: null,
  maxPoints: null,
  rider: person({ usef: '100' }),
  horse: {
    name: 'H',
    usef: '200',
    passport: null,
    fei: null,
    registration: null,
    yearOfBirth: null,
    breed: null,
  },
  owner: person({ fallbackName: 'Owner', usef: '300' }),
  trainer: { name: null, usef: null, street: null, city: null, state: null, zip: null },
  riderDisciplineNumber: null,
  ...over,
});

const input = (entries: ExportEntry[], over: Partial<ExportInput> = {}): ExportInput => ({
  show: { name: 'S', startDate: '2026-11-07', usefCompId: '12123' },
  classes: [
    {
      id: 'c1',
      title: 'A',
      sectionCode: '1502',
      qualifying: false,
      runOrder: 1,
      date: null,
      level: null,
      judges: [{ seatId: 'J1', firstName: 'Pat', lastName: 'Reed', usefId: '9001' }],
    },
  ],
  entries,
  ...over,
});

const byKey = (items: ReturnType<typeof computeUsefReadiness>) =>
  Object.fromEntries(items.map((i) => [i.key, i]));

test('a complete show is ready on every line', () => {
  const items = computeUsefReadiness(input([entry(1), entry(2)]));
  assert.equal(items.length, 7);
  assert.ok(items.every((i) => i.state === 'done'));
});

test('missing competition ID and section code are red', () => {
  const r = byKey(
    computeUsefReadiness(
      input([entry(1)], {
        show: { name: 'S', startDate: null, usefCompId: null },
        classes: [
          {
            id: 'c1',
            title: 'A',
            sectionCode: null,
            qualifying: false,
            runOrder: 1,
            date: null,
            level: null,
            judges: [],
          },
        ],
      }),
    ),
  );
  assert.equal(r['comp-id']?.state, 'todo');
  assert.equal(r['section-codes']?.state, 'todo');
  assert.equal(r['section-codes'].detail, '0 of 1 classes');
});

test('partial rider and horse numbers are amber, none is red', () => {
  const r = byKey(
    computeUsefReadiness(
      input([
        entry(1),
        entry(2, {
          rider: person(),
          horse: {
            name: 'H',
            usef: null,
            passport: null,
            fei: null,
            registration: null,
            yearOfBirth: null,
            breed: null,
          },
        }),
      ]),
    ),
  );
  assert.equal(r['rider-usef']?.state, 'warn');
  assert.equal(r['rider-usef'].detail, '1 of 2');
  assert.equal(r['horse-usef']?.state, 'warn');
  const none = byKey(computeUsefReadiness(input([entry(1, { rider: person() })])));
  assert.equal(none['rider-usef']?.state, 'todo');
});

test('a rider with an exemption reason counts as covered', () => {
  const r = byKey(
    computeUsefReadiness(input([entry(1, { rider: person({ noUsefReason: 'EX' }) })])),
  );
  assert.equal(r['rider-usef']?.state, 'done');
});

test('a rider with several rides is counted once', () => {
  const r = byKey(computeUsefReadiness(input([entry(1), entry(1, { num: '9' })])));
  assert.equal(r['rider-usef']?.detail, '1 of 1');
});

test('scratched rides are not counted as unscored', () => {
  const r = byKey(
    computeUsefReadiness(
      input([entry(1), entry(2, { status: 'scratched', finalPct: 'SCR', rank: null, pct: null })]),
    ),
  );
  assert.equal(r.scored?.detail, '1 of 1');
  assert.equal(r.scored.state, 'done');
  const open = byKey(
    computeUsefReadiness(
      input([entry(1), entry(2, { status: 'scheduled', finalPct: null, rank: null, pct: null })]),
    ),
  );
  assert.equal(open.scored?.state, 'warn');
});

test('owner needs a name and a USEF number or reason', () => {
  const r = byKey(
    computeUsefReadiness(input([entry(1, { owner: person({ fallbackName: 'Carol' }) })])),
  );
  assert.equal(r.owner?.state, 'todo');
});

test('judges are counted once and need a USEF ID', () => {
  const noId = byKey(
    computeUsefReadiness(
      input([entry(1)], {
        classes: [
          {
            id: 'c1',
            title: 'A',
            sectionCode: '1502',
            qualifying: false,
            runOrder: 1,
            date: null,
            level: null,
            judges: [{ seatId: 'J1', firstName: 'Pat', lastName: 'Reed', usefId: null }],
          },
        ],
      }),
    ),
  );
  assert.equal(noId['judge-usef']?.state, 'todo');
  assert.equal(noId['judge-usef'].detail, '0 of 1 judges');
});

test('an empty show has nothing to complain about except the competition ID', () => {
  const items = computeUsefReadiness(input([], { classes: [] }));
  assert.ok(items.every((i) => i.state === 'done'));
});
