'use client';

import { useEffect, useState } from 'react';

/** A live-updating clock string, used by the signup-preview demo workspaces' status bars. */
export function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}
