import type { Metadata } from 'next';
import { InfoIcon } from 'lucide-react';
import { listScoringCatalog, listCatalogDocuments } from '@/modules/superadmin/data/queries';
import { CatalogBoard } from '@/modules/superadmin/ui/catalog-board';

export const metadata: Metadata = {
  title: 'Scoring Catalog — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

/**
 * The platform's canonical library of test sheets, matching the Admin Console
 * design: a "Platform library" header, an advisory banner, six family stat
 * tiles, then the interactive board (upload, score-type filter, search, table).
 */
export default async function ScoringCatalogPage() {
  const [sheets, docs] = await Promise.all([listScoringCatalog(), listCatalogDocuments()]);
  const testDocs = docs.filter((d) => d.folder === 'Tests');

  const byFamily = new Map<string, number>();
  for (const sheet of sheets) {
    const family = sheet.family ?? 'unassigned';
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
  }
  const stubs = sheets.filter((s) => !s.source_file).length;

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
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">
          Platform library
        </div>
        <h1 className={`${NR} mb-2.5 text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep`}>
          Scoring Catalog
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
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
              className="flex min-w-[138px] flex-[1_1_150px] flex-col gap-1.5 rounded-[11px] border border-[#E7E0D0] bg-[#F6F3EC] px-[18px] pb-[15px] pt-4"
            >
              <span
                className={`${NR} text-[30px] leading-none`}
                style={{ color: zero ? '#C4CDC8' : '#0D2C23' }}
              >
                {tile.value}
              </span>
              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-fa-muted-2">
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
