'use client';

import { useSyncExternalStore } from 'react';

const EMPTY = '';

function subscribe() {
  return () => undefined;
}

function today(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PrintDate() {
  const date = useSyncExternalStore(subscribe, today, () => EMPTY);

  return <div className="text-right text-[12px] text-[#555]">{date}</div>;
}
