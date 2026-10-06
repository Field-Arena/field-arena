'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MARK_DEBOUNCE_MS } from '@/modules/scoring/constants';

interface PendingWrite<Value> {
  value: Value;
  // The write callback as it was when the edit was made. It closes over that
  // render's rider/seat, so a flush that lands after the screen has moved to
  // the next rider still saves to the rider the judge was marking.
  write: (key: string, value: Value) => void;
}

export function useDebouncedWrite<Value>(
  write: (key: string, value: Value) => void,
  debounceMs: number = MARK_DEBOUNCE_MS,
) {
  const writeRef = useRef(write);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, PendingWrite<Value>>());

  useEffect(() => {
    writeRef.current = write;
  }, [write]);

  const flush = useCallback((key: string) => {
    const timeout = timeouts.current.get(key);
    if (timeout) clearTimeout(timeout);
    timeouts.current.delete(key);
    const entry = pending.current.get(key);
    if (entry !== undefined) {
      pending.current.delete(key);
      entry.write(key, entry.value);
    }
  }, []);

  const flushAll = useCallback(() => {
    for (const key of [...pending.current.keys()]) flush(key);
  }, [flush]);

  // Send anything still pending on unmount instead of dropping it.
  useEffect(() => flushAll, [flushAll]);

  const debounced = useCallback(
    (key: string, value: Value) => {
      pending.current.set(key, { value, write: writeRef.current });
      const existing = timeouts.current.get(key);
      if (existing) clearTimeout(existing);
      timeouts.current.set(
        key,
        setTimeout(() => {
          flush(key);
        }, debounceMs),
      );
    },
    [debounceMs, flush],
  );

  return { debounced, flush, flushAll };
}
