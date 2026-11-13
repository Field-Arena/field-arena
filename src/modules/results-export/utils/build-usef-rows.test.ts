import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUsefRows, numberClasses } from './build-usef-rows';
import { COL, judgeColumns } from '../columns';
import type { ExportClass, ExportEntry, ExportInput, ExportPerson } from '../types';

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

const cls = (over: Partial<ExportClass> = {}): ExportClass => ({
  id: 'c1',
  title: 'Training Level Test 1',
  sectionCode: '1502',
  qualifying: false,
  runOrder: 1,
  date: '2026-11-07',
  level: 'Training Level Test 1',
  judges: [{ seatId: 'J1', firstName: 'Pat', lastName: 'Reed', usefId: '9001' }],
  ...over,
});

const entry = (over: Partial<ExportEntry> = {}): ExportEntry => ({
  classId: 'c1',
  num: '117',
  status: 'scored',
  finalPct: '68.5',
  rank: 1,
  pct: 68.5,
  riderDivision: 'A',
  judgePct: { J1: 68.5 },
  testName: null,
  maxPoints: 290,
  rider: person({
    firstName: 'Ava',
    lastName: 'Walker',
    usef: '5551234',
    email: 'ava@example.com',
    city: 'Aiken',
    state: 'SC',
    zip: '29801',
  }),
  horse: {
    name: 'Juniper M',
    usef: 'H1',
    passport: null,
    fei: null,
    registration: 'R9',
    yearOfBirth: '2016',
    breed: 'KWPN',
  },
  owner: person({ fallbackName: 'Carol Owner', usef: '777' }),
  trainer: { name: 'Kara Moore', usef: '888', street: null, city: null, state: null, zip: null },
  riderDisciplineNumber: 'USDF123',
  ...over,
});

const input = (over: Partial<ExportInput> = {}): ExportInput => ({
  show: { name: 'Harvest Dressage', startDate: '2026-11-07', usefCompId: '12123' },
  classes: [cls()],
  entries: [entry()],
  ...over,
});

test('one row per entry, 142 cells wide, header from the template', () => {
  const out = buildUsefRows(input());
  assert.equal(out.header.length, 142);
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0]?.length, 142);
});

test('fills show, class, rider, horse, owner and trainer columns', () => {
  const row = buildUsefRows(input()).rows[0] ?? [];
  assert.equal(row[COL.compYear], 2026);
  assert.equal(row[COL.compId], '12123');
  assert.equal(row[COL.classNumber], 1);
  assert.equal(row[COL.classTitle], 'Training Level Test 1');
  assert.equal(row[COL.sectionCode], '1502');
  assert.equal(row[COL.placing], 1);
  assert.equal(row[COL.exhibitorNumber], 117);
  assert.equal(row[COL.horseName], 'Juniper M');
  assert.equal(row[COL.horseRegistration], 'R9');
  assert.equal(row[COL.riderName], 'Walker Ava');
  assert.equal(row[COL.riderUsef], '5551234');
  assert.equal(row[COL.riderNoUsefWhy], null);
  assert.equal(row[COL.ownerName], 'Owner Carol');
  assert.equal(row[COL.trainerName], 'Moore Kara');
  assert.equal(row[COL.riderDisciplineNumber], 'USDF123');
  assert.equal(row[COL.dressageRiderStatus], 'Adult Amateur');
});

test('percentages and points are numbers; judge columns are filled', () => {
  const row = buildUsefRows(input()).rows[0] ?? [];
  const j = judgeColumns(0);
  assert.equal(row[j.first], 'Pat');
  assert.equal(row[j.last], 'Reed');
  assert.equal(row[j.usefId], '9001');
  assert.equal(row[j.pct], 68.5);
  assert.equal(row[j.score], 198.7);
  assert.equal(row[COL.dressageTotalPercentage], 68.5);
  assert.equal(row[COL.dressageTotalScore], 198.7);
  assert.equal(typeof row[COL.dressageTotalPercentage], 'number');
});

test('every entry is listed, with letter codes for rides that did not place', () => {
  const out = buildUsefRows(
    input({
      entries: [
        entry({ num: '1', rank: 2, pct: 66 }),
        entry({ num: '2', rank: 1, pct: 70 }),
        entry({ num: '3', status: 'scratched', finalPct: 'SCR', rank: null, pct: null }),
        entry({ num: '4', status: 'scored', finalPct: 'ELIM', rank: null, pct: null }),
        entry({ num: '5', rank: null, pct: 55 }),
      ],
    }),
  );
  const placings = out.rows.map((r) => r[COL.placing]);
  assert.deepEqual(placings, [1, 2, 0, 'S', 'E']);
  assert.equal(out.rows[0]?.[COL.numEntries], 5);
  assert.equal(out.rows[0][COL.numberCompeted], 4);
  assert.equal(out.rows[0][COL.numberCompleted], 3);
});

test('classes are numbered by running order, without leading zeros', () => {
  const classes = [
    cls({ id: 'b', title: 'B', runOrder: 2 }),
    cls({ id: 'a', title: 'A', runOrder: 1 }),
    cls({ id: 'z', title: 'Z', runOrder: null }),
  ];
  const nums = numberClasses(classes);
  assert.equal(nums.get('a'), 1);
  assert.equal(nums.get('b'), 2);
  assert.equal(nums.get('z'), 3);
});

test('a rider with no USEF number carries the reason', () => {
  const row =
    buildUsefRows(
      input({
        entries: [
          entry({ rider: person({ firstName: 'Tim', lastName: 'Lee', noUsefReason: 'EX' }) }),
        ],
      }),
    ).rows[0] ?? [];
  assert.equal(row[COL.riderUsef], null);
  assert.equal(row[COL.riderNoUsefWhy], 'EX');
});

test('long fields are cut to the length USEF allows', () => {
  const row =
    buildUsefRows(
      input({
        entries: [
          entry({
            rider: person({ firstName: 'A', lastName: 'Z'.repeat(200), state: 'South Carolina' }),
          }),
        ],
      }),
    ).rows[0] ?? [];
  assert.equal(String(row[COL.riderName]).length, 75);
  assert.equal(row[COL.riderState], 'So');
});

test('warnings: missing competition ID, section code, unscored rides, no USEF number', () => {
  const out = buildUsefRows(
    input({
      show: { name: 'S', startDate: '2026-11-07', usefCompId: null },
      classes: [cls({ sectionCode: null })],
      entries: [
        entry({
          status: 'scheduled',
          finalPct: null,
          rank: null,
          pct: null,
          rider: person({ firstName: 'A', lastName: 'B' }),
        }),
      ],
    }),
  );
  const text = out.warnings.join(' | ');
  assert.match(text, /no USEF competition ID/);
  assert.match(text, /no USEF section code: Training Level Test 1/);
  assert.match(text, /1 ride has not been scored/);
  assert.match(text, /no USEF number and no reason/);
});

test('a clean show has no warnings', () => {
  assert.deepEqual(buildUsefRows(input()).warnings, []);
});

test('entries for unknown classes are ignored, and an empty show exports only the header', () => {
  assert.equal(buildUsefRows(input({ entries: [entry({ classId: 'nope' })] })).rows.length, 0);
  assert.equal(buildUsefRows(input({ classes: [], entries: [] })).rows.length, 0);
});
