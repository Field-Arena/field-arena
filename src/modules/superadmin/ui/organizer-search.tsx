'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

export interface OrganizerOption {
  id: string;
  name: string;
  location: string;
}

/* The console's organizer switcher. Typing filters the list below (the `q`
 * parameter, so the table stays a Server Component); picking a result is a
 * navigation, which is what legacy's selectOrg() did — and where it went
 * depended on the section you were in. Billing is intentionally view-only and
 * never impersonated, so a pick there opens that organizer's billing instead
 * of entering their workspace. */
export function OrganizerSearch({ organizers }: { organizers: OrganizerOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapper = useRef<HTMLSpanElement>(null);

  const inBilling = pathname.startsWith('/dashboard/superadmin/billing');

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleChange(next: string) {
    setValue(next);
    setOpen(next.trim().length > 0);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('q', next);
      else params.delete('q');
      const query = params.toString();
      // Typing on Overview filters the full organizer list, which lives on its
      // own page now.
      const target =
        pathname === '/dashboard/superadmin' ? '/dashboard/superadmin/organizers' : pathname;
      if (target !== pathname) router.push(query ? `${target}?${query}` : target);
      else router.replace(query ? `${target}?${query}` : target, { scroll: false });
    }, 250);
  }

  function pick(org: OrganizerOption) {
    setValue(org.name);
    setOpen(false);
    router.push(
      inBilling
        ? `/dashboard/superadmin/billing/${org.id}`
        : `/dashboard/superadmin/organizations/${org.id}`,
    );
  }

  const needle = value.trim().toLowerCase();
  const matches = needle
    ? organizers
        .filter(
          (org) =>
            org.name.toLowerCase().includes(needle) || org.location.toLowerCase().includes(needle),
        )
        .slice(0, 8)
    : [];

  return (
    <span ref={wrapper} className="fa-org-switch relative">
      <label htmlFor="organizer-search" className="fa-lab">
        Org
      </label>
      <Input
        id="organizer-search"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="organizer-search-menu"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        placeholder="All organizers"
        className="h-auto w-[220px] border-0 bg-transparent px-1 py-0 text-[13px] font-medium text-[#101828] shadow-none outline-none placeholder:text-[#101828] focus-visible:ring-0"
      />

      {open && (
        <div
          id="organizer-search-menu"
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1.5 max-h-[300px] w-[280px] overflow-y-auto rounded-xl border border-[#E7EAEE] bg-white py-1.5 shadow-[0_18px_44px_rgba(9,26,21,.16)]"
        >
          {matches.length === 0 ? (
            <p className="px-3.5 py-2.5 text-[12.5px] text-[#8A94A3]">
              No organizers match &ldquo;{value}&rdquo;.
            </p>
          ) : (
            matches.map((org) => (
              <Button
                key={org.id}
                type="button"
                role="option"
                aria-selected={false}
                variant="ghost"
                onClick={() => {
                  pick(org);
                }}
                className={cn(
                  'flex h-auto w-full items-baseline justify-between gap-3 rounded-none px-3.5 py-2 text-left',
                  'hover:bg-[#FBFCFD]',
                )}
              >
                <span className="truncate text-[13px] font-semibold text-[#101828]">
                  {org.name}
                </span>
                <span className="flex-none text-[11.5px] text-[#8A94A3]">{org.location}</span>
              </Button>
            ))
          )}
        </div>
      )}
    </span>
  );
}
