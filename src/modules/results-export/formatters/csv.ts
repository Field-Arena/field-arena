import type { Cell } from '../types';

/* RFC 4180: fields with a comma, quote or line break are quoted, and quotes
 * inside are doubled. */
export function escapeCsvField(value: Cell): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const UTF8_BOM = '﻿';

/* UTF-8 with a header row. The byte-order mark makes Excel read accented
 * names correctly instead of guessing a legacy encoding. */
export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const lines = [header, ...rows].map((line) => line.map(escapeCsvField).join(','));
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}
