import type { DatFormatter } from './types';
import type { Cell } from '../../types';

/* USEF universal results, as delimited text. The column order is the 142-column
 * USEF template, unchanged.
 *
 * Layout choices set here so they are easy to change if USEF's published .dat
 * spec differs: tab delimiter, CRLF line endings, and a header row first. */
export const USEF_DAT_DELIMITER = '\t';
export const USEF_DAT_LINE_ENDING = '\r\n';

const text = (value: Cell): string =>
  value === null
    ? ''
    : String(value)
        .replace(/[\t\r\n]+/g, ' ')
        .trim();

export const usefUniversalDat: DatFormatter = {
  id: 'usef-universal',
  label: 'USEF universal results (tab-delimited)',
  extension: 'dat',
  contentType: 'text/plain;charset=utf-8',
  format(header, rows) {
    const lines = [header.map(text), ...rows.map((r) => r.map(text))];
    return (
      lines.map((line) => line.join(USEF_DAT_DELIMITER)).join(USEF_DAT_LINE_ENDING) +
      USEF_DAT_LINE_ENDING
    );
  },
};
