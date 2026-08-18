'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { CATALOG_SCORE_TYPES } from '@/modules/superadmin/constants';
import type { CatalogDocument, CatalogSheetRow as CatalogSheetRowData } from '@/modules/superadmin/types';
import { UploadSheetDialog } from '@/modules/superadmin/ui/upload-sheet-dialog';
import { CatalogSheetRow } from '@/modules/superadmin/ui/catalog-sheet-row';

const COLS = 'minmax(280px,1fr) 150px 160px 130px 110px 92px';

/** Does a sheet's governing body match the selected score-type filter? */
function matchesType(gb: string | null, type: string): boolean {
  if (type === 'All') return true;
  const value = gb ?? '';
  if (type === 'Independent') return value === '' || value === 'Independent';
  if (type.includes('/')) return value === type;
  return value.split('/').includes(type);
}

/**
 * The interactive catalog: the "Upload official sheet" action, the score-type
 * filter buttons with live counts, search, and the sheet table — matching the
 * Admin Console design. Data arrives as props; only the filter and search state
 * live here.
 */
export function CatalogBoard({
  sheets,
  docs,
}: {
  sheets: CatalogSheetRowData[];
  docs: CatalogDocument[];
}) {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

  // The real uploaded PDF for a sheet lives in the documents store (Tests
  // folder), keyed by the sheet's source_file. This is what makes "View PDF"
  // link to an actual file rather than just marking the sheet Official.
  const docByName = new Map(docs.map((d) => [d.name, d] as const));

  const filters = useMemo(
    () =>
      ['All', ...CATALOG_SCORE_TYPES].map((t) => ({
        label: t,
        count: sheets.filter((s) => matchesType(s.governing_body, t)).length,
      })),
    [sheets]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sheets.filter((s) => {
      if (!matchesType(s.governing_body, type)) return false;
      if (!term) return true;
      return (
        s.title.toLowerCase().includes(term) ||
        (s.level ?? '').toLowerCase().includes(term) ||
        (s.discipline ?? '').toLowerCase().includes(term)
      );
    });
  }, [sheets, type, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <UploadSheetDialog />
        <span className="text-[12.5px] text-fa-muted-2">
          Create a sheet stub here, then attach its PDF from the File column.
        </span>
      </div>

      <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8E4] px-5 py-3.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2">
            Score type
          </span>
          {filters.map((f) => {
            const on = type === f.label;
            return (
              <Button
                key={f.label}
                type="button"
                variant="ghost"
                onClick={() => {
                  setType(f.label);
                }}
                className={cn(
                  'h-auto inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold hover:bg-transparent transition-colors',
                  on
                    ? 'border-hunter-deep bg-hunter-deep text-paper'
                    : 'border-[#D7E0DA] bg-white text-[#5A6B63] hover:border-gold'
                )}
              >
                {f.label}
                <span className={cn('text-[12px] font-medium', on ? 'text-paper/60' : 'text-[#9AA6A0]')}>
                  {f.count}
                </span>
              </Button>
            );
          })}
          <div className="relative ml-auto min-w-[170px] flex-[0_1_250px]">
            <SearchIcon
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9AA6A0]"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search sheets…"
              className="h-auto w-full rounded-lg border border-[#D7E0DA] bg-white py-2 pl-[33px] pr-3 text-[13px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.14]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid min-w-[920px] gap-4 bg-[#F6F0E2] px-5 py-[11px]"
            style={{ gridTemplateColumns: COLS }}
          >
            {['Sheet', 'Level', 'Scoring family', 'Provenance', 'File', ''].map((h) => (
              <span
                key={h || 'action'}
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2"
              >
                {h}
              </span>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="px-6 py-[42px] text-center text-[13.5px] text-fa-muted-2">
              No sheets match this filter.
            </div>
          ) : (
            visible.map((sheet, i) => (
              <CatalogSheetRow
                key={sheet.id}
                sheet={sheet}
                doc={sheet.source_file ? docByName.get(sheet.source_file) : undefined}
                index={i}
              />
            ))
          )}
        </div>

        <div className="border-t border-[#E2E8E4] px-5 py-3 text-[12.5px] text-fa-muted-2">
          {visible.length} of {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
