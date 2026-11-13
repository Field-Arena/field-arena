import type { DatFormatter } from './types';
import { usefUniversalDat } from './usef-universal';

export type { DatFormatter } from './types';

export const DAT_FORMATTERS: Readonly<Record<string, DatFormatter>> = {
  [usefUniversalDat.id]: usefUniversalDat,
};

export const DEFAULT_DAT_FORMAT = usefUniversalDat.id;

export function getDatFormatter(id: string = DEFAULT_DAT_FORMAT): DatFormatter {
  const formatter = DAT_FORMATTERS[id];
  if (!formatter) throw new Error(`Unknown .dat format "${id}".`);
  return formatter;
}
