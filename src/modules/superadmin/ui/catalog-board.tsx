'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SearchIcon, UploadIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { CATALOG_FAMILY_META, CATALOG_SCORE_TYPES } from '../constants';
import type { CatalogDocument, CatalogSheetRow } from '../data/queries';
import { useUploadDocument } from '../hooks/use-document-mutations';
import { UploadSheetDialog } from './upload-sheet-dialog';

function readFile(file: File): Promise<{ dataBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({ dataBase64: result.split(',')[1] ?? '', contentType: file.type || 'application/pdf' });
    };
    reader.onerror = () => {
      reject(new Error('Could not read the file'));
    };
    reader.readAsDataURL(file);
  });
}

const COLS = 'minmax(280px,1fr) 150px 160px 130px 110px 92px';
const FAM_FALLBACK = {
  label: 'Unassigned',
  blurb: 'Scoring family not yet confirmed',
  bg: '#F1F3F2',
  fg: '#7A8781',
  bd: '#E2E8E4',
};

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
  sheets: CatalogSheetRow[];
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
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setType(f.label);
                }}
                className={cn(
                  'inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors',
                  on
                    ? 'border-hunter-deep bg-hunter-deep text-paper'
                    : 'border-[#D7E0DA] bg-white text-[#5A6B63] hover:border-gold'
                )}
              >
                {f.label}
                <span className={cn('text-[12px] font-medium', on ? 'text-paper/60' : 'text-[#9AA6A0]')}>
                  {f.count}
                </span>
              </button>
            );
          })}
          <div className="relative ml-auto min-w-[170px] flex-[0_1_250px]">
            <SearchIcon
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9AA6A0]"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search sheets…"
              className="w-full rounded-lg border border-[#D7E0DA] bg-white py-2 pl-[33px] pr-3 text-[13px] text-hunter-deep focus-visible:border-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/[.14]"
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
            visible.map((sheet, i) => {
              const fam = CATALOG_FAMILY_META[sheet.family ?? 'unassigned'] ?? FAM_FALLBACK;
              const official = Boolean(sheet.source_file);
              return (
                <div
                  key={sheet.id}
                  className="grid min-w-[920px] items-center gap-4 border-b border-[#EEF2EF] px-5 py-[11px] last:border-b-0"
                  style={{ gridTemplateColumns: COLS, background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                >
                  <div className="min-w-0">
                    <div className="mb-1.5 text-[14px] font-bold text-[#16261F]">{sheet.title}</div>
                    <div className="flex items-center gap-2">
                      {sheet.governing_body && (
                        <span className="inline-flex h-[18px] items-center rounded-[5px] bg-[#1F4A5C] px-[7px] text-[10px] font-bold tracking-[0.06em] text-white">
                          {sheet.governing_body}
                        </span>
                      )}
                      <span className="text-[12px] text-fa-muted-2">{sheet.discipline ?? '—'}</span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[13.5px] text-[#16261F]">
                    {sheet.level ?? '—'}
                  </span>
                  <span
                    className="inline-flex h-6 w-fit items-center whitespace-nowrap rounded-md border px-2.5 text-[11.5px] font-bold"
                    style={{ background: fam.bg, borderColor: fam.bd, color: fam.fg }}
                  >
                    {fam.label}
                  </span>
                  <span className="inline-flex h-6 w-fit items-center whitespace-nowrap rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold text-[#7A6A3C]">
                    {official ? 'Official' : 'Stub'}
                  </span>
                  <CatalogFileCell
                    doc={sheet.source_file ? docByName.get(sheet.source_file) : undefined}
                    sourceFile={sheet.source_file}
                  />
                  <div className="flex justify-end">
                    <Link
                      href={`/dashboard/superadmin/catalog/${sheet.id}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16261F] transition-colors hover:text-gold"
                    >
                      Open
                      <ArrowRightIcon className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#E2E8E4] px-5 py-3 text-[12.5px] text-fa-muted-2">
          {visible.length} of {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}

/**
 * The File column for one sheet: a real "View PDF" link when the source PDF has
 * been uploaded to the documents store, an inline Upload when it hasn't (the file
 * is stored under the sheet's source_file name so both surfaces stay in sync), or
 * a "No file" marker when the sheet designates no source document at all.
 */
function CatalogFileCell({
  doc,
  sourceFile,
}: {
  doc: CatalogDocument | undefined;
  sourceFile: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  if (doc?.url) {
    return (
      <a
        href={doc.url}
        target="_blank"
        rel="noreferrer"
        className="text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px] hover:text-gold"
      >
        View PDF
      </a>
    );
  }

  if (!sourceFile) {
    return (
      <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold text-[#9AA6A0]">
        No file
      </span>
    );
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void readFile(file).then(({ dataBase64, contentType }) => {
              upload.mutate({ folder: 'Tests', name: sourceFile, dataBase64, contentType });
            });
          }
          event.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8A6D14] transition-colors hover:text-gold disabled:opacity-60"
      >
        <UploadIcon className="size-[13px]" aria-hidden />
        {upload.isPending ? 'Uploading…' : 'Upload'}
      </button>
    </>
  );
}
