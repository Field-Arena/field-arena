'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';

export function OrganizerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
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

  return (
    <span className="flex items-center gap-2">
      <label
        htmlFor="organizer-search"
        className="text-fa-muted text-[11px] font-bold tracking-[0.06em] uppercase"
      >
        Organizer
      </label>
      <Input
        id="organizer-search"
        type="search"
        value={value}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
        placeholder="Search organizers…"
        className="border-border text-ink focus-visible:border-gold focus-visible:ring-gold/30 h-auto w-[210px] rounded-lg border bg-white px-3 py-1.5 text-[13px] outline-none placeholder:text-[#8a968f] focus-visible:ring-2"
      />
    </span>
  );
}
