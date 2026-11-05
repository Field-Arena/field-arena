'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onTick: () => void): () => void {
  const id = setInterval(onTick, 1000);
  return () => {
    clearInterval(id);
  };
}

function readTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/* null on the server and during hydration, so the server HTML and the first
 * client render match (a time string differs between the two and between
 * locales); the live time takes over right after mount. */
export function useClock(): string | null {
  return useSyncExternalStore(subscribe, readTime, () => null);
}
