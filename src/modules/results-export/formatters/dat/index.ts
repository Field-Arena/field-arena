import type { DatFormatter } from './types';
import { placeholderDat } from './placeholder';

export type { DatFormatter } from './types';

export const DAT_FORMATTERS: Readonly<Record<string, DatFormatter>> = {
  [placeholderDat.id]: placeholderDat,
};

export const DEFAULT_DAT_FORMAT = placeholderDat.id;

export function getDatFormatter(id: string = DEFAULT_DAT_FORMAT): DatFormatter {
  const formatter = DAT_FORMATTERS[id];
  if (!formatter) throw new Error(`Unknown .dat format "${id}".`);
  return formatter;
}
