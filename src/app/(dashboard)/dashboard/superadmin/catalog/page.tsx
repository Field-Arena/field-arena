import type { Metadata } from 'next';
import { InfoIcon } from 'lucide-react';
import { listScoringCatalog, listCatalogDocuments } from '@/modules/superadmin/data/queries';
import { CatalogBoard } from '@/modules/superadmin/ui/catalog-board';
import { groupSheetsByFamily } from '@/modules/superadmin/utils/group-sheets-by-family';

export const metadata: Metadata = {
  title: 'Scoring Catalog — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

export default async function ScoringCatalogPage() {
  const [sheets, docs] = await Promise.all([listScoringCatalog(), listCatalogDocuments()]);
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
      <div className="max-w-[680px]">
        <div className="text-gold mb-3 text-[10.5px] font-bold tracking-[0.18em] uppercase">
          Platform library
        </div>
        <h1
          className={`${NR} text-hunter-deep mb-2.5 text-[32px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          Scoring Catalog
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.6]">
          The platform&rsquo;s canonical library of official test sheets. Field &amp; Arena curates
          each sheet once here; every organizer&rsquo;s show draws its scoring from this catalog.
          Each sheet maps to one of the scoring families that drive the scoreboard.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[#EBDCAF] bg-[#FCF6E4] px-4 py-3.5">
        <InfoIcon className="mt-0.5 size-4 flex-none text-[#8A6D14]" aria-hidden />
        <p className="text-[13.5px] leading-[1.55] text-[#7A5E12]">
          Attach the official USDF / USEF / FEI document to every sheet before a show publishes
          against it. Scoring family is what the scoreboard reads — set it carefully; changing it
          after entries open re-runs every score on that sheet.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tiles.map((tile) => {
          const zero = tile.value === 0;
          return (
            <div
              key={tile.label}
              className="flex min-w-[138px] flex-[1_1_150px] flex-col gap-1.5 rounded-[11px] border border-[#E7E0D0] bg-[#F6F3EC] px-[18px] pt-4 pb-[15px]"
            >
              <span
                className={`${NR} text-[30px] leading-none`}
                style={{ color: zero ? '#C4CDC8' : '#0D2C23' }}
              >
                {tile.value}
              </span>
              <span className="text-fa-muted-2 text-[10px] font-bold tracking-[0.14em] whitespace-nowrap uppercase">
                {tile.label}
              </span>
            </div>
          );
        })}
      </div>

      <CatalogBoard sheets={sheets} docs={testDocs} />
    </div>
  );
}
