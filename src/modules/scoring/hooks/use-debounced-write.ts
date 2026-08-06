'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MARK_DEBOUNCE_MS } from '../constants';

/**
 * Debounces writes across a dynamic set of fields (one movement/collective
 * mark stepper each) behind a single hook instance, keyed by field id —
 * legacy's own per-field window: 400ms for marks (`postMarkDebounced`),
 * 500ms for remarks (`_remarkDebounce`), a separate, slower timer.
 * `flush(key)` or `flushAll()` runs any pending write immediately; called
 * before Sign & Submit so the last-touched value is never lost to a window
 * that hasn't fired yet (`flushMarkDebounce`).
 */
export function useDebouncedWrite<Value>(
  write: (key: string, value: Value) => void,
  debounceMs: number = MARK_DEBOUNCE_MS
) {
  const writeRef = useRef(write);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, Value>());

  useEffect(() => {
    writeRef.current = write;
  }, [write]);

  useEffect(
    () => () => {
      timeouts.current.forEach((t) => {
        clearTimeout(t);
      });
    },
    []
  );

  const flush = useCallback((key: string) => {
    const timeout = timeouts.current.get(key);
    if (timeout) clearTimeout(timeout);
    timeouts.current.delete(key);
    const value = pending.current.get(key);
    if (value !== undefined) {
      pending.current.delete(key);
      writeRef.current(key, value);
    }
  }, []);

  const flushAll = useCallback(() => {
    for (const key of [...pending.current.keys()]) flush(key);
  }, [flush]);

  const debounced = useCallback(
    (key: string, value: Value) => {
      pending.current.set(key, value);
      const existing = timeouts.current.get(key);
      if (existing) clearTimeout(existing);
      timeouts.current.set(
        key,
        setTimeout(() => {
          timeouts.current.delete(key);
          const finalValue = pending.current.get(key);
          pending.current.delete(key);
          if (finalValue !== undefined) writeRef.current(key, finalValue);
        }, debounceMs)
      );
    },
    [debounceMs]
  );

  return { debounced, flush, flushAll };
}
