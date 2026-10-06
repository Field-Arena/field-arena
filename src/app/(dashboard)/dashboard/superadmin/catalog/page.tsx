import type { Metadata } from 'next';
import { InfoIcon } from 'lucide-react';
import {
  listScoringCatalog,
  listCatalogDocuments,
  listIndependentTestTemplates,
} from '@/modules/superadmin/data/queries';
import { CatalogBoard } from '@/modules/superadmin/ui/catalog-board';
import { UploadSheetDialog } from '@/modules/superadmin/ui/upload-sheet-dialog';
import { IndependentTemplatesPanel } from '@/modules/superadmin/ui/independent-templates-panel';
import { StatTiles } from '@/modules/superadmin/ui/stat-tiles';
import { groupSheetsByFamily } from '@/modules/superadmin/utils/group-sheets-by-family';

export const metadata: Metadata = {
  title: 'Scoring Catalog — SuperAdmin Console',
};

export default async function ScoringCatalogPage() {
  const [sheets, docs, independentTemplates] = await Promise.all([
    listScoringCatalog(),
    listCatalogDocuments(),
    listIndependentTestTemplates(),
  ]);
  const testDocs = docs.filter((d) => d.folder === 'Tests');

  const { byFamily, stubs } = groupSheetsByFamily(sheets);

  const tiles: { label: string; value: number }[] = [
    { label: 'Sheets', value: sheets.length },
    { label: 'Movement', value: byFamily.get('movement') ?? 0 },
    { label: 'Freestyle', value: byFamily.get('freestyle') ?? 0 },
    { label: 'Weighted', value: byFamily.get('weighted') ?? 0 },
    { label: 'Placing', value: byFamily.get('placing') ?? 0 },
    { label: 'Stubs', value: stubs },
  ];

  return (
    <div className="space-y-7">
      <div className="fa-page-head">
        <div className="max-w-[680px]">
          <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
            Scoring Catalog
          </h1>
          <p className="text-[14.5px] leading-[1.6] text-[#475467]">
            The platform&rsquo;s canonical library of official test sheets. Field &amp; Arena
            curates each sheet once here; every organizer&rsquo;s show draws its scoring from this
            catalog. Each sheet maps to one of the scoring families that drive the scoreboard.
            Upload an official sheet to create its stub, then attach the PDF from the File column.
          </p>
        </div>
        <div className="fa-head-actions">
          <UploadSheetDialog />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[#F6DCB8] bg-[#FDF2E3] px-4 py-3.5">
        <InfoIcon className="mt-0.5 size-4 flex-none text-[#B45309]" aria-hidden />
        <p className="text-[13.5px] leading-[1.55] text-[#B45309]">
          Attach the official USDF / USEF / FEI document to every sheet before a show publishes
          against it. Scoring family is what the scoreboard reads — set it carefully; changing it
          after entries open re-runs every score on that sheet.
        </p>
      </div>

      <StatTiles tiles={tiles} />

      <CatalogBoard
        sheets={sheets}
        docs={testDocs}
        independentTemplateCount={independentTemplates.length}
        independentTemplates={<IndependentTemplatesPanel templates={independentTemplates} />}
      />
    </div>
  );
}
