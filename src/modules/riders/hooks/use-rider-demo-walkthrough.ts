'use client';

import { useEffect, useState } from 'react';
import { useEntryCartStore } from '@/modules/riders/store';

export function useRiderDemoWalkthrough(stepCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reset = useEntryCartStore((state) => state.reset);

  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [reset]);

  return {
    activeIndex,
    goTo: setActiveIndex,
    goPrev: () => {
      setActiveIndex((i) => Math.max(0, i - 1));
    },
    goNext: () => {
      setActiveIndex((i) => Math.min(stepCount - 1, i + 1));
    },
  };
}
