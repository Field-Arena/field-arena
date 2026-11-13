import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, inflateRawSync } from 'node:zlib';
import { toXlsx, xmlEscape } from './xlsx';

/* Reads the zip back the way a spreadsheet program would: end record, then the
 * central directory, then each entry, checking the checksum as it goes. */
function readZip(buffer: Buffer): Map<string, string> {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(eocd >= 0, 'zip end record present');
  const count = buffer.readUInt16LE(eocd + 10);
  let p = buffer.readUInt32LE(eocd + 16);
  const files = new Map<string, string>();
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(p), 0x02014b50);
    const method = buffer.readUInt16LE(p + 10);
    const crc = buffer.readUInt32LE(p + 16);
    const compressedSize = buffer.readUInt32LE(p + 20);
    const size = buffer.readUInt32LE(p + 24);
    const nameLength = buffer.readUInt16LE(p + 28);
    const localOffset = buffer.readUInt32LE(p + 42);
    const name = buffer.subarray(p + 46, p + 46 + nameLength).toString('utf8');
    assert.equal(buffer.readUInt32LE(localOffset), 0x04034b50);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    assert.equal(method, 8);
    const data = inflateRawSync(buffer.subarray(start, start + compressedSize));
    assert.equal(data.length, size);
    assert.equal(crc32(data), crc);
    files.set(name, data.toString('utf8'));
    p += 46 + nameLength;
  }
  return files;
}

test('the workbook is a valid zip with every required part', () => {
  const files = readZip(toXlsx(['Name', 'Pct'], [['Smith Jane', 68.5]]));
  for (const part of [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml',
  ]) {
    assert.ok(files.has(part), `${part} present`);
  }
});

test('header is bold and frozen; numbers are numbers; text is text', () => {
  const sheet = readZip(
    toXlsx(
      ['Name', 'Pct', 'Place'],
      [
        ['Smith Jane', 68.5, 1],
        ['Zoë', null, 'S'],
      ],
    ),
  ).get('xl/worksheets/sheet1.xml');
  assert.ok(sheet);
  assert.match(
    sheet,
    /<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"\/>/,
  );
  assert.match(
    sheet,
    /<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Name<\/t><\/is><\/c>/,
  );
  assert.match(sheet, /<c r="B2"><v>68\.5<\/v><\/c>/);
  assert.match(sheet, /<c r="C2"><v>1<\/v><\/c>/);
  assert.match(sheet, /<c r="C3" t="inlineStr">/);
  assert.match(sheet, /Zoë/);
  assert.doesNotMatch(sheet, /r="B3"/);
});

test('columns are sized to fit, within limits', () => {
  const sheet =
    readZip(toXlsx(['A', 'Long header here'], [['x'.repeat(200), 'y']])).get(
      'xl/worksheets/sheet1.xml',
    ) ?? '';
  assert.match(sheet, /<col min="1" max="1" width="60" customWidth="1"\/>/);
  assert.match(sheet, /<col min="2" max="2" width="18" customWidth="1"\/>/);
});

test('special characters are escaped and illegal ones dropped', () => {
  assert.equal(xmlEscape('Tom & "Jerry" <b>'), 'Tom &amp; &quot;Jerry&quot; &lt;b&gt;');
  assert.equal(xmlEscape('a\u0000b\u0008c'), 'abc');
  assert.equal(xmlEscape('tab\there'), 'tab\there');
});

test('a 142-wide sheet names its columns correctly past Z', () => {
  const header = Array.from({ length: 142 }, (_, i) => `H${String(i)}`);
  const sheet =
    readZip(toXlsx(header, [header.map((_, i) => i)])).get('xl/worksheets/sheet1.xml') ?? '';
  assert.match(sheet, /<c r="AA1"/);
  assert.match(sheet, /<c r="EL1"/);
  assert.match(sheet, /<c r="EL2"><v>141<\/v><\/c>/);
});

test('an empty export is just the header row', () => {
  const sheet = readZip(toXlsx(['A'], [])).get('xl/worksheets/sheet1.xml') ?? '';
  assert.match(sheet, /<row r="1">/);
  assert.doesNotMatch(sheet, /<row r="2">/);
});
