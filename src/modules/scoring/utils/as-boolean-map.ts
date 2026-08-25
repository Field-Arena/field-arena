import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';

export function asBooleanMap(json: unknown): Record<string, boolean> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'boolean') out[k] = v;
  return out;
}
