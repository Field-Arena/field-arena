import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';
import type { TestDefinition } from '@/modules/scoring/scoring-engine';

export function parseTestMovements(json: unknown): TestDefinition['movements'] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isJsonRecord)
    .map((m) => ({
      num: Number(m.n ?? m.num ?? 0),
      text: typeof m.text === 'string' ? m.text : '',
      coef: Number(m.coef ?? 1),
    }))
    .filter((m) => m.num > 0);
}
