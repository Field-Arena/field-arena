import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';
import type { MarkEntry } from '@/modules/scoring/types';

export function parseMarkMap(json: unknown): Record<string, MarkEntry> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, MarkEntry> = {};
  for (const [key, raw] of Object.entries(json)) {
    if (isJsonRecord(raw)) {
      const value = typeof raw.value === 'number' ? raw.value : null;
      const enteredBy = raw.enteredBy === 'judge' || raw.enteredBy === 'scribe' ? raw.enteredBy : null;
      out[key] = { value, enteredBy };
    } else if (typeof raw === 'number') {
      out[key] = { value: raw, enteredBy: null };
    }
  }
  return out;
}
