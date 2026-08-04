import type { ActionResult } from './action-result';

/**
 * Turns a returned action failure back into a thrown Error, in the browser.
 *
 * Nothing redacts an error thrown client-side, so the message survives intact
 * and every existing `onError` handler — and `readableError()` — keeps working
 * exactly as it did when actions threw directly. That is the point: adopting
 * `ActionResult` costs one line per `mutationFn` and nothing else.
 *
 *     mutationFn: async (input) => unwrap(await addStaffUser(input)),
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.message);
}
