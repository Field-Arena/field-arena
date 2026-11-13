import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportFilename } from './filename';

test('filenames are slugged and carry the extension', () => {
  assert.equal(
    exportFilename('Demo · Harvest Dressage Festival', 'csv'),
    'field-and-arena-results-demo-harvest-dressage-festival.csv',
  );
  assert.equal(exportFilename('  !!  ', 'dat'), 'field-and-arena-results-show.dat');
});
