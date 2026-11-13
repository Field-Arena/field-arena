'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/shadcn/input';
import type { TestCatalogEntry, TestTemplateRow } from '@/modules/shows/types';
import {
  buildTestPickerGroups,
  flattenTestPickerGroups,
  type TestPickerOption,
} from '@/modules/shows/utils/test-picker-options';
import { SM_INPUT } from '@/modules/shows/ui/show-manager/tokens';

/* "Choose a test to edit" — one searchable list over the org's own tests and
 * the official catalog. A combobox in the WAI-ARIA sense: focus stays in the
 * input, arrow keys move the highlighted option (aria-activedescendant),
 * Enter picks it, Escape closes. What picking does (open in the editor vs.
 * clone a copy) is up to the parent. */
export function TestPicker({
  templates,
  catalog,
  usedByTemplateId,
  selectedKey,
  onPick,
}: {
  templates: TestTemplateRow[];
  catalog: TestCatalogEntry[];
  usedByTemplateId: Record<string, number>;
  /** testPickerKey() of the test open in the editor, if any. */
  selectedKey: string | null;
  onPick: (option: TestPickerOption) => void;
}) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const groups = useMemo(
    () => buildTestPickerGroups(templates, catalog, usedByTemplateId, query),
    [templates, catalog, usedByTemplateId, query],
  );
  const flat = useMemo(() => flattenTestPickerGroups(groups), [groups]);
  const indexByKey = useMemo(() => new Map(flat.map((o, i) => [o.key, i])), [flat]);
  const active = flat[Math.min(activeIndex, flat.length - 1)];
  const optionId = (key: string) => `${baseId}-opt-${key}`;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (!open || !active) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(active.key)}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function pick(option: TestPickerOption) {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    onPick(option);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const last = flat.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(Math.max(last, 0));
        }
        break;
      case 'Enter':
        if (open && active) {
          event.preventDefault();
          pick(active);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        } else if (query) {
          setQuery('');
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={wrapper} className="relative">
      <label htmlFor={`${baseId}-input`} className="sr-only">
        Choose a test to edit
      </label>
      <div className="relative">
        <Input
          id={`${baseId}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active ? optionId(active.key) : undefined}
          autoComplete="off"
          value={query}
          placeholder={`Search ${String(templates.length + catalog.length)} tests by name, level or governing body…`}
          className={`h-auto pr-9 ${SM_INPUT}`}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onClick={() => {
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#8A94A3]"
        />
      </div>

      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Tests"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-[380px] overflow-y-auto rounded-xl border border-[#E7EAEE] bg-white py-1.5 shadow-[0_18px_44px_rgba(9,26,21,.16)]"
        >
          {groups.length === 0 ? (
            <p className="px-3.5 py-2.5 text-[12.5px] text-[#8A94A3]">
              {query ? <>No test matches &ldquo;{query}&rdquo;.</> : <>No tests yet.</>}
            </p>
          ) : (
            groups.map((group) => (
              <div
                key={group.kind}
                role="group"
                aria-labelledby={`${baseId}-g-${group.kind}`}
                className="pb-1"
              >
                <div
                  id={`${baseId}-g-${group.kind}`}
                  className="sticky top-0 z-10 border-b border-[#EEF1F4] bg-white px-3.5 pt-2 pb-1.5 text-[11.5px] font-bold tracking-[.06em] text-[#475467] uppercase"
                >
                  {group.title} ({group.count})
                </div>
                {group.levels.map((lvl) => (
                  <div key={lvl.level} role="presentation">
                    <div
                      role="presentation"
                      className="px-3.5 pt-2 pb-0.5 text-[11px] font-semibold text-[#98A29D]"
                    >
                      {lvl.level}
                    </div>
                    {lvl.options.map((option) => {
                      const index = indexByKey.get(option.key) ?? -1;
                      const isActive = active?.key === option.key;
                      const isSelected = option.key === selectedKey;
                      const meta = [option.governingBody, option.level]
                        .filter((p): p is string => Boolean(p))
                        .join(' · ');
                      return (
                        <div
                          key={option.key}
                          id={optionId(option.key)}
                          data-key={option.key}
                          role="option"
                          aria-selected={isSelected}
                          // Pick on mousedown so the input's blur/outside-click
                          // handling doesn't close the list first.
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pick(option);
                          }}
                          onMouseMove={() => {
                            if (index >= 0 && !isActive) setActiveIndex(index);
                          }}
                          className={cn(
                            'flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-1.5',
                            isActive && 'bg-[#EAF5EF]',
                          )}
                        >
                          <span
                            className={cn(
                              'min-w-0 truncate text-[13px] text-[#101828]',
                              isSelected ? 'font-bold' : 'font-semibold',
                            )}
                          >
                            {option.name}
                            {isSelected && (
                              <span className="ml-1.5 text-[11px] font-semibold text-[#146A47]">
                                (open)
                              </span>
                            )}
                          </span>
                          <span className="flex flex-none items-baseline gap-2 text-[11.5px] text-[#8A94A3]">
                            {option.kind === 'org' && option.usedBy > 0 && (
                              <span className="font-semibold text-[#146A47]">
                                Used by {option.usedBy} {option.usedBy === 1 ? 'class' : 'classes'}{' '}
                                in this show
                              </span>
                            )}
                            {meta && <span>{meta}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
