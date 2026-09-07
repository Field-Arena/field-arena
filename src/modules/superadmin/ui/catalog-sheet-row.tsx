import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { CATALOG_FAMILY_META } from '@/modules/superadmin/constants';
import type {
  CatalogDocument,
  CatalogSheetRow as CatalogSheetRowData,
} from '@/modules/superadmin/types';
import { CatalogFileCell } from '@/modules/superadmin/ui/catalog-file-cell';

const COLS = 'minmax(280px,1fr) 150px 160px 130px 110px 92px';
/* Legacy srcPill() — the four curation states, distinct from whether a PDF is
 * attached (that is the File column, right next to it). */
interface ProvenancePill {
  label: string;
  bg: string;
  fg: string;
  bd: string;
}

const STUB_PILL: ProvenancePill = {
  label: 'Stub',
  bg: '#F1F3F2',
  fg: '#7A8781',
  bd: '#E2E8E4',
};

const SOURCE_PILL: Record<string, ProvenancePill> = {
  stub: STUB_PILL,
  manual: { label: 'Verified · manual', bg: '#E6F1EA', fg: '#2E7048', bd: '#D3E6DA' },
  parsed: { label: 'Auto-extracted', bg: '#E8EFF6', fg: '#2F5A87', bd: '#D3E1EE' },
  typical: { label: 'Typical default', bg: '#F9F0D8', fg: '#8A6D14', bd: '#EBDCAF' },
};

const FAM_FALLBACK = {
  label: 'Unassigned',
  blurb: 'Scoring family not yet confirmed',
  bg: '#F1F3F2',
  fg: '#7A8781',
  bd: '#E2E8E4',
};

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
  const provenance = SOURCE_PILL[sheet.source ?? 'stub'] ?? STUB_PILL;

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
          <span className="text-fa-muted-2 text-[12px]">{sheet.discipline ?? '—'}</span>
        </div>
      </div>
      <span className="text-[13.5px] whitespace-nowrap text-[#16261F]">{sheet.level ?? '—'}</span>
      <span
        className="inline-flex h-6 w-fit items-center rounded-md border px-2.5 text-[11.5px] font-bold whitespace-nowrap"
        style={{ background: fam.bg, borderColor: fam.bd, color: fam.fg }}
      >
        {fam.label}
      </span>
      <span
        className="inline-flex h-6 w-fit items-center rounded-md border px-2.5 text-[11.5px] font-semibold whitespace-nowrap"
        style={{ background: provenance.bg, borderColor: provenance.bd, color: provenance.fg }}
      >
        {provenance.label}
      </span>
      <CatalogFileCell doc={doc} sourceFile={sheet.source_file} />
      <div className="flex justify-end">
        <Link
          href={`/dashboard/superadmin/catalog/${sheet.id}`}
          className="hover:text-gold inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16261F] transition-colors"
        >
          Open
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
