import type { Cell } from '../../types';

/* One module per .dat output spec. Adding a spec means adding a file that
 * exports a DatFormatter and listing it in index.ts; nothing else changes. */
export interface DatFormatter {
  id: string;
  label: string;
  extension: 'dat';
  contentType: string;
  format(header: readonly string[], rows: readonly (readonly Cell[])[]): string;
}
