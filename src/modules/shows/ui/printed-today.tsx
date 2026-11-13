'use client';

import { useSyncExternalStore } from 'react';

// Same pattern as shared/ui/print-date.tsx: the server renders nothing and
// the client fills in its own date after hydration, so the server's UTC /
// default-locale date can never mismatch the browser's.
function subscribe() {
  return () => undefined;
}

function today(): string {
  return new Date().toLocaleDateString('en-US');
}

export function PrintedToday() {
  return <>{useSyncExternalStore(subscribe, today, () => '')}</>;
}
