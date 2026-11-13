import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DAT_FORMAT, getDatFormatter } from './index';

test('the default .dat format is registered', () => {
  const formatter = getDatFormatter();
  assert.equal(formatter.id, DEFAULT_DAT_FORMAT);
  assert.equal(formatter.extension, 'dat');
});

test('an unknown .dat format is refused', () => {
  assert.throws(() => getDatFormatter('nope'), /Unknown \.dat format/);
});

test('usef-universal is tab-delimited with CRLF and keeps every column', () => {
  const out = getDatFormatter('usef-universal').format(['A', 'B', 'C'], [['x', null, 3]]);
  assert.equal(out, 'A\tB\tC\r\nx\t\t3\r\n');
});

test('tabs and line breaks inside values cannot break the layout', () => {
  const out = getDatFormatter('usef-universal').format(['A'], [['has\ttab\nand newline']]);
  assert.equal(out, 'A\r\nhas tab and newline\r\n');
});
