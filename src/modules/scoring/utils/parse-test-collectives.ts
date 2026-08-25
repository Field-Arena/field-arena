import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';
import type { TestDefinition } from '@/modules/scoring/scoring-engine';

export function parseTestCollectives(json: unknown): TestDefinition['collectives'] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isJsonRecord)
    .map((c) => ({
      key: typeof c.key === 'string' ? c.key : '',
      label: typeof c.label === 'string' ? c.label : '',
      coef: Number(c.coef ?? 1),
      section: typeof c.section === 'string' ? c.section : undefined,
    }))
    .filter((c) => c.key !== '');
}
