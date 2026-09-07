'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { CATALOG_SCORE_TYPES } from '@/modules/superadmin/constants';
import type {
  CatalogDocument,
  CatalogSheetRow as CatalogSheetRowData,
} from '@/modules/superadmin/types';
import { UploadSheetDialog } from '@/modules/superadmin/ui/upload-sheet-dialog';
import { CatalogSheetRow } from '@/modules/superadmin/ui/catalog-sheet-row';

const COLS = 'minmax(280px,1fr) 150px 160px 130px 110px 92px';

function matchesType(gb: string | null, type: string): boolean {
  if (type === 'All') return true;
  const value = gb ?? '';
  if (type === 'Independent') return value === '' || value === 'Independent';
  if (type.includes('/')) return value === type;
  return value.split('/').includes(type);
}

export function CatalogBoard({
  sheets,
  docs,
  independentTemplates,
  independentTemplateCount,
}: {
  sheets: CatalogSheetRowData[];
  docs: CatalogDocument[];
  independentTemplates: ReactNode;
  independentTemplateCount: number;
}) {
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

  const docByName = new Map(docs.map((d) => [d.name, d] as const));

  const filters = useMemo(
    () =>
      ['All', ...CATALOG_SCORE_TYPES].map((t) => ({
        label: t,
        // The Independent tab counts organizer-built Test Builder templates
        // alongside catalog sheets, as legacy's tab count did — they are the
        // Independent tests that actually exist on the platform.
        count:
          sheets.filter((s) => matchesType(s.governing_body, t)).length +
          (t === 'Independent' || t === 'All' ? independentTemplateCount : 0),
      })),
    [sheets, independentTemplateCount],
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
        <span className="text-fa-muted-2 text-[12.5px]">
          Create a sheet stub here, then attach its PDF from the File column.
        </span>
      </div>

      <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8E4] px-5 py-3.5">
          <span className="text-fa-muted-2 mr-1 text-[10px] font-bold tracking-[0.14em] uppercase">
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
                  'inline-flex h-auto items-baseline gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors hover:bg-transparent',
                  on
                    ? 'border-hunter-deep bg-hunter-deep text-paper'
                    : 'hover:border-gold border-[#D7E0DA] bg-white text-[#5A6B63]',
                )}
              >
                {f.label}
                <span
                  className={cn('text-[12px] font-medium', on ? 'text-paper/60' : 'text-[#9AA6A0]')}
                >
                  {f.count}
                </span>
              </Button>
            );
          })}
          <div className="relative ml-auto min-w-[170px] flex-[0_1_250px]">
            <SearchIcon
              className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#9AA6A0]"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search sheets…"
              className="text-hunter-deep focus-visible:border-gold focus-visible:ring-gold/[.14] h-auto w-full rounded-lg border border-[#D7E0DA] bg-white py-2 pr-3 pl-[33px] text-[13px] focus-visible:ring-[3px] focus-visible:outline-none"
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
                className="text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] uppercase"
              >
                {h}
              </span>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="text-fa-muted-2 px-6 py-[42px] text-center text-[13.5px]">
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

        <div className="text-fa-muted-2 border-t border-[#E2E8E4] px-5 py-3 text-[12.5px]">
          {visible.length} of {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
        </div>
      </div>

      {type === 'Independent' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-[#EBDCAF] bg-[#FCF6E4] px-4 py-3.5">
            <p className="text-[13.5px] leading-[1.55] text-[#7A5E12]">
              <strong className="text-[#16261F]">Independent scoring.</strong> For shows not run
              under a governing body — schooling shows, series, in-house classes, or an
              organizer&rsquo;s own format. An uploaded sheet behaves like any official test: the
              same fillable form, live totals, and percentage.
            </p>
          </div>
          {independentTemplates}
        </>
      )}
    </div>
  );
}
