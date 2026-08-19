'use client';

import { useEffect, useState } from 'react';

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
