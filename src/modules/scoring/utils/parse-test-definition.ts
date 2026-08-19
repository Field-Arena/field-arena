import { isJsonRecord } from '@/modules/scoring/utils/is-json-record';
import { parseTestMovements } from '@/modules/scoring/utils/parse-test-movements';
import { parseTestCollectives } from '@/modules/scoring/utils/parse-test-collectives';
import type { TestDefinition } from '@/modules/scoring/scoring-engine';

/** A def-shaped JSON blob (class_tests row or scoring_catalog.def) to a TestDefinition. */
export function parseTestDefinition(
  fallbackName: string | undefined,
  def: unknown
): TestDefinition | null {
  if (!isJsonRecord(def)) return null;
  const name = typeof def.name === 'string' ? def.name : (fallbackName ?? '');
  return {
    name,
    movements: parseTestMovements(def.movements),
    collectives: parseTestCollectives(def.collectives),
  };
}
