import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';

export function asStringMap(json: unknown): Record<string, string> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'string') out[k] = v;
  return out;
}
