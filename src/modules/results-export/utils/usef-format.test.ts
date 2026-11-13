import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanClassTitle,
  clampLength,
  formatLastFirst,
  placingFor,
  pointsFromPct,
  riderStatusFor,
  roundPct,
} from './usef-format';

test('names are "Last First" with no comma', () => {
  assert.equal(formatLastFirst('Jane', 'Smith'), 'Smith Jane');
  assert.equal(formatLastFirst('  Jane ', ' Smith '), 'Smith Jane');
  assert.equal(formatLastFirst(null, null, 'Jane Smith'), 'Smith Jane');
  assert.equal(formatLastFirst(null, null, 'Smith, Jane'), 'Smith Jane');
  assert.equal(formatLastFirst(null, null, 'Mary Ann Smith'), 'Smith Mary Ann');
  assert.equal(formatLastFirst(null, null, 'Cher'), 'Cher');
  assert.equal(formatLastFirst(null, null, null), '');
});

test('class titles lose quotation marks', () => {
  assert.equal(cleanClassTitle('Training "Level" Test 1'), 'Training Level Test 1');
  assert.equal(cleanClassTitle("Adult Am. Test of Choice's"), 'Adult Am. Test of Choices');
});

test('placings: numbers, zeros and USEF letter codes', () => {
  const base = { status: 'scored', finalPct: '68.5', rank: 2, pct: 68.5 };
  assert.equal(placingFor(base), '2');
  assert.equal(placingFor({ ...base, rank: null }), '0');
  assert.equal(placingFor({ status: 'scratched', finalPct: 'SCR', rank: null, pct: null }), 'S');
  assert.equal(placingFor({ status: 'scored', finalPct: 'ELIM', rank: null, pct: null }), 'E');
  assert.equal(placingFor({ status: 'disqualified', finalPct: null, rank: null, pct: null }), 'DQ');
  assert.equal(placingFor({ status: 'scheduled', finalPct: null, rank: null, pct: null }), '');
});

test('percentages keep three decimals, points keep one', () => {
  assert.equal(roundPct(68.12345), 68.123);
  assert.equal(roundPct(70), 70);
  assert.equal(pointsFromPct(68.5, 290), 198.7);
});

test('fields longer than USEF allows are cut, numbers are not', () => {
  assert.equal(clampLength('abcdef', 4), 'abcd');
  assert.equal(clampLength('abc', 4), 'abc');
  assert.equal(clampLength('abcdef', null), 'abcdef');
  assert.equal(clampLength(123456, 3), 123456);
  assert.equal(clampLength(null, 3), null);
});

test('rider status', () => {
  assert.equal(riderStatusFor('J'), 'JR/YR');
  assert.equal(riderStatusFor('Y'), 'JR/YR');
  assert.equal(riderStatusFor('A'), 'Adult Amateur');
  assert.equal(riderStatusFor('O'), 'Open');
  assert.equal(riderStatusFor(null), '');
});
