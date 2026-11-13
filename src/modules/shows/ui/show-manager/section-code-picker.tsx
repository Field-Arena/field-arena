'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pill, FA_BTN_SMALL } from '@/shared/ui/organizer/fa-page';
import { useSetClassSectionCode } from '@/modules/shows/hooks/use-select-events-mutations';
import {
  suggestSectionCodes,
  type UsefSectionCode,
} from '@/modules/shows/utils/suggest-section-codes';
import type { SelectedClassOption } from '@/modules/shows/types';

const POPOVER_WIDTH = 520;
const POPOVER_MAX_HEIGHT = 340;
const VIEWPORT_MARGIN = 8;
const COLLAPSED_LIMIT = 6;

type Option =
  | { kind: 'code'; key: string; code: UsefSectionCode }
  | { kind: 'clear'; key: string }
  | { kind: 'all'; key: string };

interface Anchor {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

function dressageFirst(a: UsefSectionCode, b: UsefSectionCode): number {
  const rank = (c: UsefSectionCode) => (c.divisionName.toLowerCase() === 'dressage' ? 0 : 1);
  return rank(a) - rank(b) || a.sortOrder - b.sortOrder;
}

export function SectionCodeCell({
  showId,
  cls,
  codes,
}: {
  showId: string;
  cls: SelectedClassOption;
  codes: UsefSectionCode[];
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [optimistic, setOptimistic] = useState<{
    base: string | null;
    code: string | null;
  } | null>(null);

  const cellRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate } = useSetClassSectionCode();

  const currentCode = optimistic?.base === cls.sectionCode ? optimistic.code : cls.sectionCode;
  const currentName = currentCode
    ? (codes.find((c) => c.code === currentCode)?.sectionName ?? cls.sectionName)
    : null;

  const suggestions = useMemo(() => suggestSectionCodes(cls.label, codes), [cls.label, codes]);

  const trimmed = query.trim().toLowerCase();
  const { visible, header, canShowAll, total } = useMemo(() => {
    if (!trimmed) {
      if (showAll) {
        return {
          visible: [...codes].sort(dressageFirst),
          header: `${String(codes.length)} codes in the USEF 2026 list`,
          canShowAll: false,
          total: codes.length,
        };
      }
      return {
        visible: suggestions,
        header:
          suggestions.length > 0
            ? `${String(suggestions.length)} suggested for this class`
            : 'No suggestion for this class — type to search',
        canShowAll: true,
        total: codes.length,
      };
    }
    const words = trimmed.split(/\s+/);
    const matches = codes.filter((c) => {
      const haystack = `${c.code} ${c.sectionName} ${c.divisionName}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
    const rankOf = (c: UsefSectionCode) => {
      const i = suggestions.findIndex((s) => s.code === c.code);
      return i === -1 ? suggestions.length : i;
    };
    matches.sort((a, b) => rankOf(a) - rankOf(b) || dressageFirst(a, b));
    return {
      visible: showAll ? matches : matches.slice(0, COLLAPSED_LIMIT),
      header: `${String(matches.length)} ${matches.length === 1 ? 'match' : 'matches'} in the USEF 2026 list`,
      canShowAll: !showAll && matches.length > COLLAPSED_LIMIT,
      total: matches.length,
    };
  }, [trimmed, showAll, suggestions, codes]);

  const options: Option[] = [
    ...(currentCode ? [{ kind: 'clear', key: 'clear' } as const] : []),
    ...visible.map((code) => ({ kind: 'code', key: code.code, code }) as const),
    ...(canShowAll ? [{ kind: 'all', key: 'all' } as const] : []),
  ];
  const activeIndex = Math.min(active, options.length - 1);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || cellRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onScrollOrResize(e: Event) {
      if (e.target instanceof Node && popoverRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${listId}-${String(activeIndex)}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, listId]);

  function openPicker() {
    const rect = cellRef.current?.getBoundingClientRect();
    if (!rect) return;
    const roomBelow = window.innerHeight - rect.bottom;
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const above = roomBelow < POPOVER_MAX_HEIGHT && rect.top > roomBelow;
    setAnchor({
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
      ),
      width,
      ...(above ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
    setQuery('');
    setActive(0);
    setShowAll(false);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function save(code: string | null) {
    setOptimistic({ base: cls.sectionCode, code });
    mutate(
      { showId, classId: cls.id, code },
      {
        onError: () => {
          setOptimistic(null);
        },
      },
    );
    close();
  }

  function choose(option: Option | undefined) {
    if (!option) return;
    if (option.kind === 'clear') save(null);
    else if (option.kind === 'code') save(option.code.code);
    else {
      setShowAll(true);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((activeIndex + 1) % Math.max(options.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((activeIndex - 1 + options.length) % Math.max(options.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(options[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={cellRef} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {currentCode ? (
        <>
          <span className="font-mono text-[13.5px] font-bold text-[#1A5B3C]">{currentCode}</span>
          {currentName && (
            <span className="text-[12.5px] text-[#5A6B63] capitalize">
              {currentName.toLowerCase()}
            </span>
          )}
        </>
      ) : (
        <Pill tone="red">Needs a section code</Pill>
      )}
      <button
        ref={triggerRef}
        type="button"
        className={FA_BTN_SMALL}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${currentCode ? 'Change' : 'Pick'} USEF section for ${cls.label}`}
        onClick={() => {
          if (open) setOpen(false);
          else openPicker();
        }}
      >
        {currentCode ? 'Change' : 'Pick'}
      </button>

      {open && anchor && (
        <div
          ref={popoverRef}
          className="fixed z-50 overflow-hidden rounded-[12px] border-2 border-[#1A5B3C] bg-white shadow-[0_12px_32px_-12px_rgba(16,40,32,.35)]"
          style={anchor}
        >
          <div className="border-b border-[#EDF0EE] p-2">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={
                options.length > 0 ? `${listId}-${String(activeIndex)}` : undefined
              }
              aria-autocomplete="list"
              aria-label={`Search USEF section codes for ${cls.label}`}
              placeholder="Search by code or name"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setShowAll(false);
              }}
              onKeyDown={onKeyDown}
              className="text-ink-deep w-full rounded-[8px] border-2 border-[#C9D3CE] bg-white px-2.5 py-1.5 text-[13.5px] outline-none focus-visible:border-[#1A5B3C]"
            />
          </div>
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-[.06em] text-[#5A6B63] uppercase">
            {header}
          </p>
          <ul
            id={listId}
            role="listbox"
            aria-label="USEF section codes"
            className="overflow-y-auto"
            style={{ maxHeight: POPOVER_MAX_HEIGHT - 96 }}
          >
            {options.map((option, i) => (
              <li
                key={option.key}
                id={`${listId}-${String(i)}`}
                role="option"
                aria-selected={option.kind === 'code' && option.code.code === currentCode}
                onPointerDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  choose(option);
                }}
                onMouseMove={() => {
                  if (i !== activeIndex) setActive(i);
                }}
                className={`flex cursor-pointer items-baseline gap-3 border-t border-[#EDF0EE] px-3 py-2 text-[13px] ${
                  i === activeIndex ? 'bg-[#E9F4EE]' : 'bg-white'
                }`}
              >
                {option.kind === 'code' && (
                  <>
                    <span className="w-11 flex-none font-mono font-bold text-[#1A5B3C]">
                      {option.code.code}
                    </span>
                    <span className="text-ink-deep min-w-0 flex-1 uppercase">
                      {option.code.sectionName}
                      {option.code.divisionName.toLowerCase() !== 'dressage' && (
                        <span className="text-[11px] text-[#5A6B63] normal-case">
                          {' '}
                          · {option.code.divisionName.toLowerCase()}
                        </span>
                      )}
                    </span>
                  </>
                )}
                {option.kind === 'clear' && (
                  <span className="font-semibold text-[#98341F]">Clear section code</span>
                )}
                {option.kind === 'all' && (
                  <span className="font-semibold text-[#5A6B63]">
                    Show all {String(total)} {trimmed ? 'matches' : 'codes'}…
                  </span>
                )}
              </li>
            ))}
            {options.length === 0 && (
              <li className="border-t border-[#EDF0EE] px-3 py-3 text-[13px] text-[#5A6B63] italic">
                No codes match &ldquo;{query.trim()}&rdquo;.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
