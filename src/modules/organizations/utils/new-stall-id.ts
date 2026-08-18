let stallSeq = 0;

/**
 * A locally-unique stall id, ported from legacy's `locStallIdGen` (`'vst'+Date.now()+…`).
 * A monotonic counter is appended instead of `Math.random()` so two stalls
 * created within the same millisecond (a fast double-click on "+ Add stall
 * row", or two calls in the same render) can never collide.
 */
export function newStallId(): string {
  stallSeq += 1;
  return `vst${String(Date.now())}${String(stallSeq)}`;
}
