'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { ShowListItem } from '@/modules/shows/data/queries';

export function ShowPickerCombobox({
  shows,
  currentShow,
}: {
  shows: ShowListItem[];
  currentShow: ShowListItem;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectShow(showId: string) {
    setOpen(false);
    if (showId === currentShow.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('show', showId);
    router.push(`${pathname}?${params.toString()}`);
  }

  function jumpTo(edge: 'top' | 'bottom') {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: edge === 'top' ? 0 : list.scrollHeight, behavior: 'smooth' });
  }

  const label = currentShow.name + (currentShow.dateLabel ? ` (${currentShow.dateLabel})` : '');

  return (
    <div ref={rootRef} className="relative flex-1" style={{ maxWidth: 380 }}>
      <button
        type="button"
        className="dash-select flex items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className="flex-none opacity-60" aria-hidden />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-full min-w-[280px] overflow-hidden rounded-[10px] border border-[#D9E1DD] bg-white shadow-lg">
          {shows.length > 6 && (
            <button
              type="button"
              onClick={() => {
                jumpTo('top');
              }}
              className="flex w-full items-center justify-center gap-1.5 border-b border-[#EEF2F0] bg-[#FAFAF6] py-1.5 text-[11.5px] font-semibold text-[#5A6B63] hover:bg-[#F0F3F1]"
              aria-label="Jump to top of list"
            >
              <ChevronsUp size={13} aria-hidden /> Top
            </button>
          )}

          <ul
            ref={listRef}
            role="listbox"
            aria-label="Select show"
            className="max-h-[280px] overflow-y-auto py-1"
          >
            {shows.map((show) => {
              const active = show.id === currentShow.id;
              return (
                <li key={show.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      selectShow(show.id);
                    }}
                    className={`block w-full truncate px-3 py-2 text-left text-[13.5px] ${
                      active
                        ? 'text-forest bg-[#EAF4EC] font-semibold'
                        : 'text-ink-deep hover:bg-[#F5F7F6]'
                    }`}
                  >
                    {show.name}
                    {show.dateLabel ? ` (${show.dateLabel})` : ''}
                  </button>
                </li>
              );
            })}
          </ul>

          {shows.length > 6 && (
            <button
              type="button"
              onClick={() => {
                jumpTo('bottom');
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-[#EEF2F0] bg-[#FAFAF6] py-1.5 text-[11.5px] font-semibold text-[#5A6B63] hover:bg-[#F0F3F1]"
              aria-label="Jump to bottom of list"
            >
              <ChevronsDown size={13} aria-hidden /> Bottom
            </button>
          )}
        </div>
      )}
    </div>
  );
}
