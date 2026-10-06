import type { TestDefinition } from '@/modules/scoring/scoring-engine';

/**
 * The test a ride is actually scored against: the entry's own override when it
 * carries a real definition, else the class test. A name-only override (no
 * movements — see checkout's `{ name }` fallback) can't be scored, so it falls
 * back to the class test rather than producing an empty sheet.
 */
export function resolveEffectiveTest(
  override: TestDefinition | null,
  classTest: TestDefinition | null,
): TestDefinition | null {
  return override && override.movements.length > 0 ? override : classTest;
}
