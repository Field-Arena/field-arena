'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

/**
 * The "Search organizers…" field from the legacy console's button bar.
 *
 * Filtering is driven through a `q` search parameter rather than local state
 * alone. The field lives in the shell while the table it filters lives in the
 * page, so purely local state would need a client boundary wrapping both — which
 * would force the table to stop being a Server Component. A URL parameter keeps
 * the table server-rendered and makes a filtered view shareable as a side effect.
 *
 * The input keeps its own state and never syncs back from the parameter. Syncing
 * would mean calling setState inside an effect, and keying the input off the
 * parameter instead would remount it on every debounced update — losing focus and
 * cursor position mid-word. Since this component is the only thing that writes
 * `q`, there is nothing to drift from.
 */
export function OrganizerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);

    // Debounced so typing does not fire a server round trip per keystroke.
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
        className="text-fa-muted text-[11px] font-bold uppercase tracking-[0.06em]"
      >
        Organizer
      </label>
      <input
        id="organizer-search"
        type="search"
        value={value}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
        placeholder="Search organizers…"
        className="w-[210px] rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-[#8a968f] focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30"
      />
    </span>
  );
}
