import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { CATALOG_FAMILY_META } from '@/modules/superadmin/constants';
import type { CatalogDocument, CatalogSheetRow as CatalogSheetRowData } from '@/modules/superadmin/types';
import { CatalogFileCell } from '@/modules/superadmin/ui/catalog-file-cell';

const COLS = 'minmax(280px,1fr) 150px 160px 130px 110px 92px';
const FAM_FALLBACK = {
  label: 'Unassigned',
  blurb: 'Scoring family not yet confirmed',
  bg: '#F1F3F2',
  fg: '#7A8781',
  bd: '#E2E8E4',
};

/** One row in the catalog table's sheet list. */
export function CatalogSheetRow({
  sheet,
  doc,
  index,
}: {
  sheet: CatalogSheetRowData;
  doc: CatalogDocument | undefined;
  index: number;
}) {
  const fam = CATALOG_FAMILY_META[sheet.family ?? 'unassigned'] ?? FAM_FALLBACK;
  const official = Boolean(sheet.source_file);

  return (
    <div
      className="grid min-w-[920px] items-center gap-4 border-b border-[#EEF2EF] px-5 py-[11px] last:border-b-0"
      style={{ gridTemplateColumns: COLS, background: index % 2 ? '#FBF7EC' : '#FFFFFF' }}
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
      <span className="whitespace-nowrap text-[13.5px] text-[#16261F]">{sheet.level ?? '—'}</span>
      <span
        className="inline-flex h-6 w-fit items-center whitespace-nowrap rounded-md border px-2.5 text-[11.5px] font-bold"
        style={{ background: fam.bg, borderColor: fam.bd, color: fam.fg }}
      >
        {fam.label}
      </span>
      <span className="inline-flex h-6 w-fit items-center whitespace-nowrap rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold text-[#7A6A3C]">
        {official ? 'Official' : 'Stub'}
      </span>
      <CatalogFileCell doc={doc} sourceFile={sheet.source_file} />
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
}
