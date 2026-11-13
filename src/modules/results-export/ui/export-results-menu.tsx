'use client';

import { useEffect, useRef, useState } from 'react';
import { FA_BTN_PRIMARY, Pill } from '@/shared/ui/organizer/fa-page';
import { EXPORT_FORMAT_OPTIONS, exportHref } from '@/modules/results-export/ui/export-formats';

interface Preview {
  rowCount: number;
  warnings: string[];
}

function isPreview(value: unknown): value is Preview {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.rowCount === 'number' &&
    Array.isArray(v.warnings) &&
    v.warnings.every((w) => typeof w === 'string')
  );
}

/* "Export results" button with a menu of formats. Opening it asks the server
 * for the row count and anything the organizer should fix before sending the
 * file to USEF; the download links go straight to the permission-checked route. */
export function ExportResultsMenu({ showRef }: { showRef: string }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | 'error' | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setPreview(null);
    try {
      const res = await fetch(`${exportHref(showRef, 'csv')}&preview=1`, { cache: 'no-store' });
      const body: unknown = await res.json();
      setPreview(res.ok && isPreview(body) ? body : 'error');
    } catch {
      setPreview('error');
    }
  }

  return (
    <div ref={wrapper} className="relative flex-none">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          void toggle();
        }}
        className={FA_BTN_PRIMARY}
      >
        <span aria-hidden>⬇</span> Export results <span aria-hidden>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-[min(430px,90vw)] overflow-hidden rounded-[12px] border-2 border-[#1A5B3C] bg-white shadow-[0_12px_30px_rgba(13,44,35,.18)]"
        >
          <p className="bg-[#F5F7F6] px-3.5 py-2.5 text-[11.5px] font-bold tracking-[.05em] text-[#5A6B63] uppercase">
            {preview !== null && preview !== 'error'
              ? `Export ${String(preview.rowCount)} rows · 142 USEF columns`
              : 'Export results · 142 USEF columns'}
          </p>
          {EXPORT_FORMAT_OPTIONS.map((option) => (
            <a
              key={option.format}
              role="menuitem"
              href={exportHref(showRef, option.format)}
              download
              onClick={() => {
                setOpen(false);
              }}
              className="block border-t border-[#EDF0EE] px-3.5 py-2.5 text-[#0D2C23] no-underline hover:bg-[#E9F4EE]"
            >
              <span className="text-[13.5px] font-bold">{option.label}</span>
              {option.tag && (
                <Pill tone="yellow" className="ml-2">
                  {option.tag}
                </Pill>
              )}
              <span className="block text-[12.5px] font-medium text-[#5A6B63]">{option.blurb}</span>
            </a>
          ))}
          {preview !== null && preview !== 'error' && preview.warnings.length > 0 && (
            <div className="border-t-[1.5px] border-[#E0A800] bg-[#FCF3E4] px-3.5 py-2.5">
              <p className="text-[12.5px] font-bold text-[#6B5200]">Before you send this to USEF</p>
              <ul className="m-0 mt-1 list-none p-0 text-[12.5px] leading-[1.6] text-[#6B5200]">
                {preview.warnings.map((warning) => (
                  <li key={warning}>⚠ {warning}</li>
                ))}
              </ul>
            </div>
          )}
          {preview === 'error' && (
            <p className="border-t border-[#EDF0EE] px-3.5 py-2.5 text-[12.5px] text-[#98341F]">
              Couldn&apos;t check the file for problems, but you can still download it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
