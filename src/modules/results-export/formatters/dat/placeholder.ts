import type { DatFormatter } from './types';
import type { Cell } from '../../types';

/* TODO: the federation's real .dat layout (column order, delimiter, fixed-width
 * fields) is pending the spec file from Alexis. Until it arrives this writes the
 * same columns as the .csv, pipe-delimited, with a header row. When the spec
 * lands, add a new formatter module next to this one and point
 * DEFAULT_DAT_FORMAT at it; nothing else needs to change. */
export const PLACEHOLDER_DAT_DELIMITER = '|';
export const PLACEHOLDER_DAT_LINE_ENDING = '\r\n';

/* A delimiter or line break inside a value would shift every column after it. */
const text = (value: Cell): string =>
  value === null
    ? ''
    : String(value)
        .replace(/[|\t\r\n]+/g, ' ')
        .trim();

export const placeholderDat: DatFormatter = {
  id: 'placeholder',
  label: 'Placeholder layout (pipe-delimited) — real USEF layout pending',
  extension: 'dat',
  contentType: 'text/plain;charset=utf-8',
  format(header, rows) {
    const lines = [header.map(text), ...rows.map((r) => r.map(text))];
    return (
      lines.map((line) => line.join(PLACEHOLDER_DAT_DELIMITER)).join(PLACEHOLDER_DAT_LINE_ENDING) +
      PLACEHOLDER_DAT_LINE_ENDING
    );
  },
};
