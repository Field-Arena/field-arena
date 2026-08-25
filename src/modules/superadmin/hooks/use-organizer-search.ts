'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/** Debounced organizer-name search, synced to the `q` URL param. */
export function useOrganizerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('q', next);
      else params.delete('q');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);
  }

  return { value, onChange };
}
