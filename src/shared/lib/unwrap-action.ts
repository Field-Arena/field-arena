import type { ActionResult } from './action-result';

export function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.message);
}
