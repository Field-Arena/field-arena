'use client';

import { useEffect, useState } from 'react';

/** A self-decrementing "resend in Ns" countdown, seconds → 0. */
export function useResendCooldown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [seconds]);

  return {
    seconds,
    start: (fromSeconds: number) => {
      setSeconds(fromSeconds);
    },
  };
}
