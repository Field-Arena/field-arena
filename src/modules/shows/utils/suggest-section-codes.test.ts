import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestSectionCodes, type UsefSectionCode } from './suggest-section-codes';

const code = (
  codeValue: string,
  divisionName: string,
  sectionName: string,
  sortOrder: number,
): UsefSectionCode => ({ code: codeValue, divisionName, sectionName, sortOrder });

const CODES: UsefSectionCode[] = [
  code('4500', 'ARABIAN/HALF-ARABIAN DRESSAGE', 'ARABIAN/HALF-ARABIAN DRESSAGE', 93),
  code('1500', 'DRESSAGE', 'DRESSAGE - TOC', 155),
  code('1502', 'DRESSAGE', 'TRAINING LEVEL DRESSAGE', 156),
  code('1503', 'DRESSAGE', 'A/A TRAINING LEVEL DRESSAGE', 157),
  code('1504', 'DRESSAGE', 'FIRST LEVEL DRESSAGE', 158),
  code('1507', 'DRESSAGE', 'SECOND LEVEL DRESSAGE', 159),
  code('1510', 'DRESSAGE', 'THIRD LEVEL DRESSAGE', 160),
  code('1513', 'DRESSAGE', 'FOURTH LEVEL DRESSAGE', 161),
  code('1531', 'DRESSAGE', 'PRIX ST. GEORGE LEVEL', 165),
  code('1533', 'DRESSAGE', 'INTERMEDIATE I', 167),
  code('7510', 'WESTERN DRESSAGE', 'TRAINING LEVEL', 577),
  code('9961', 'PARA DRESSAGE', 'FEI PARA DRESSAGE INTRODUCTORY TEST B', 276),
  code('9980', 'DRESSAGE', 'FEI CHILDREN PRELIMINARY A/B TEST', 269),
];

const top = (label: string) => suggestSectionCodes(label, CODES)[0]?.code;

test('Training Level Test 3 suggests Training Level Dressage first', () => {
  assert.equal(top('Training Level Test 3'), '1502');
});

test('Dressage division outranks another discipline with the same section name', () => {
  const codes = suggestSectionCodes('Training Level Test 1', CODES).map((c) => c.code);
  assert.ok(codes.indexOf('1502') < codes.indexOf('7510'));
});

test('a code with extra unmatched words ranks below the plain match', () => {
  const codes = suggestSectionCodes('Training Level Test 2', CODES).map((c) => c.code);
  assert.ok(codes.indexOf('1502') < codes.indexOf('1503'));
});

test('numbered levels map to their level', () => {
  assert.equal(top('First Level Test 1'), '1504');
  assert.equal(top('1st Level Test 3'), '1504');
  assert.equal(top('Second Level Test 2'), '1507');
  assert.equal(top('Third Level Test 1'), '1510');
  assert.equal(top('Fourth Level Test 2'), '1513');
});

test('Prix St. Georges matches the PSG level code', () => {
  assert.equal(top('Prix St. Georges'), '1531');
});

test('Intro Level Test B finds an introductory section', () => {
  assert.equal(top('Intro Level Test B'), '9961');
});

test('matching is case-insensitive', () => {
  assert.equal(top('SECOND LEVEL test 3'), '1507');
});

test('a label with no matching words suggests nothing', () => {
  assert.deepEqual(suggestSectionCodes('Hunter Pleasure', CODES), []);
  assert.deepEqual(suggestSectionCodes('Level', CODES), []);
});

test('limit caps the number of suggestions', () => {
  assert.equal(suggestSectionCodes('Level Dressage', CODES, 2).length, 2);
});
