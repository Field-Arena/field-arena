import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvField, toCsv } from './csv';

test('commas, quotes and line breaks are quoted; quotes are doubled', () => {
  assert.equal(escapeCsvField('plain'), 'plain');
  assert.equal(escapeCsvField('a,b'), '"a,b"');
  assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvField('line1\nline2'), '"line1\nline2"');
  assert.equal(escapeCsvField('cr\rhere'), '"cr\rhere"');
  assert.equal(escapeCsvField(null), '');
  assert.equal(escapeCsvField(68.5), '68.5');
});

test('csv is UTF-8 with a BOM, a header row and CRLF endings', () => {
  const csv = toCsv(
    ['Name', 'Pct'],
    [
      ['Smith, Jane', 68.5],
      ['Zoë', null],
    ],
  );
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.slice(1), 'Name,Pct\r\n"Smith, Jane",68.5\r\nZoë,\r\n');
});

test('an empty export is just the header', () => {
  assert.equal(toCsv(['A', 'B'], []).slice(1), 'A,B\r\n');
});
