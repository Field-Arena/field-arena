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

test('the placeholder is pipe-delimited with CRLF and keeps every column', () => {
  const out = getDatFormatter('placeholder').format(['A', 'B', 'C'], [['x', null, 3]]);
  assert.equal(out, 'A|B|C\r\nx||3\r\n');
});

test('pipes, tabs and line breaks inside values cannot break the layout', () => {
  const out = getDatFormatter('placeholder').format(
    ['A', 'B'],
    [['has|pipe\ttab\nand newline', 'ok']],
  );
  assert.equal(out, 'A|B\r\nhas pipe tab and newline|ok\r\n');
});
