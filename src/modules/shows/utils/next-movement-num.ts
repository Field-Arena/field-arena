import type { TestTemplateMovement } from '@/modules/shows/data/setup-queries';

export function nextMovementNum(movements: TestTemplateMovement[]): number {
  return movements.reduce((max, m) => Math.max(max, m.num), 0) + 1;
}
