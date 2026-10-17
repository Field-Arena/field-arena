'use client';

import { useMemo, useState } from 'react';
import { DownloadIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { FA_BTN_PRIMARY, FA_BTN_SMALL, FA_INPUT, FA_SELECT } from '@/shared/ui/organizer/fa-page';
import type { EntryLedgerRow } from '@/modules/shows/data/entry-ledger-queries';
import { downloadBackNumberCards } from '@/modules/shows/utils/download-back-number-cards';

export function BackNumberCardsPanel({ showId, rows }: { showId: string; rows: EntryLedgerRow[] }) {
  const eligible = useMemo(() => rows.filter((r) => r.backNumber !== null), [rows]);
  const classes = useMemo(
    () => [...new Set(eligible.flatMap((r) => r.classes))].sort((a, b) => a.localeCompare(b)),
    [eligible],
  );

  const [classFilter, setClassFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cardWidthIn, setCardWidthIn] = useState('8.5');
  const [cardHeightIn, setCardHeightIn] = useState('5.5');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => eligible.filter((r) => !classFilter || r.classes.includes(classFilter)),
    [eligible, classFilter],
  );
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.showEntryId));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const r of filtered) next.delete(r.showEntryId);
        return next;
      }
      const next = new Set(prev);
      for (const r of filtered) next.add(r.showEntryId);
      return next;
    });
  }

  async function download(ids: string[], label: string) {
    setError(null);
    setPending(label);
    try {
      await downloadBackNumberCards(showId, ids, {
        cardWidthIn: Number(cardWidthIn) || undefined,
        cardHeightIn: Number(cardHeightIn) || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the back number cards.');
    } finally {
      setPending(null);
    }
  }

  if (eligible.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
          }}
          className={FA_SELECT}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="block space-y-1 text-[12px] font-semibold text-[#5A6B63]">
          <span>Card width (in)</span>
          <input
            type="number"
            step="0.1"
            value={cardWidthIn}
            onChange={(e) => {
              setCardWidthIn(e.target.value);
            }}
            className={cn(FA_INPUT, 'block h-9 w-[80px] px-2.5 py-1 text-[13px]')}
          />
        </label>
        <label className="block space-y-1 text-[12px] font-semibold text-[#5A6B63]">
          <span>Card height (in)</span>
          <input
            type="number"
            step="0.1"
            value={cardHeightIn}
            onChange={(e) => {
              setCardHeightIn(e.target.value);
            }}
            className={cn(FA_INPUT, 'block h-9 w-[80px] px-2.5 py-1 text-[13px]')}
          />
        </label>
      </div>

      <label className="flex items-center gap-1.5 text-[13px] text-[#5A6B63]">
        <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} />
        Select all ({filtered.length})
      </label>

      <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-[10px] border-[1.5px] border-[#C9D3CE] bg-white p-2">
        {filtered.map((r) => (
          <li
            key={r.showEntryId}
            className="flex items-center justify-between gap-2 px-1 py-1 text-[12.5px]"
          >
            <label className="flex flex-1 items-center gap-2">
              <input
                type="checkbox"
                checked={selected.has(r.showEntryId)}
                onChange={() => {
                  toggle(r.showEntryId);
                }}
              />
              <span className="font-semibold">{r.riderName}</span>
              <span className="text-[#5A6B63]">
                {r.horseName} · #{r.backNumber}
              </span>
            </label>
            <button
              type="button"
              className={FA_BTN_SMALL}
              disabled={pending !== null}
              onClick={() => {
                void download([r.showEntryId], r.showEntryId);
              }}
            >
              {pending === r.showEntryId ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                'Reprint'
              )}
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="text-[12.5px] text-[#B4432F]">{error}</p>}

      <button
        type="button"
        className={cn(FA_BTN_PRIMARY, 'w-fit')}
        disabled={selected.size === 0 || pending !== null}
        onClick={() => {
          void download([...selected], 'bulk');
        }}
      >
        {pending === 'bulk' ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
        ) : (
          <DownloadIcon className="size-4" aria-hidden />
        )}
        Download back number cards ({selected.size})
      </button>
    </div>
  );
}
