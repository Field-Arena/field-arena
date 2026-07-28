import type { Metadata } from 'next';
import { listScoringCatalog } from '@/modules/superadmin/data/queries';
import { StatusBadge } from '@/shared/ui/status-badge';
import { StatTile } from '@/shared/ui/stat-tile';

export const metadata: Metadata = {
  title: 'Scoring Catalog — SuperAdmin Console',
};

/**
 * The platform test-sheet library.
 *
 * This is the table whose absence was the clearest data-loss bug in the legacy
 * build: the catalog was a hardcoded `const CATALOG` array inside
 * superadmin.html with no backend, so every edit made through its own catalog
 * editor was lost on refresh. It is now real rows.
 *
 * `family` decides how a sheet renders, and only the movement family has a
 * renderer today — freestyle, weighted and placing sheets exist as catalog
 * entries with no scoring UI behind them yet. That is surfaced rather than
 * hidden, because an organizer picking a freestyle sheet needs to know it cannot
 * be scored yet.
 */
export default async function ScoringCatalogPage() {
  const sheets = await listScoringCatalog();

  const byFamily = new Map<string, number>();
  const byBody = new Map<string, number>();
  for (const sheet of sheets) {
    const family = sheet.family ?? 'unassigned';
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
    const body = sheet.governing_body ?? 'Independent';
    byBody.set(body, (byBody.get(body) ?? 0) + 1);
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mb-1 font-serif text-[32px] font-bold leading-tight text-hunter-deep">
          Scoring Catalog
        </h1>
        <p className="text-fa-muted text-[15px]">
          The platform-level test-sheet library every organizer&rsquo;s show draws from.
        </p>
      </div>

      <section aria-label="Catalog summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Sheets" value={sheets.length} sub="in the catalog" />
          <StatTile
            label="Movement family"
            value={byFamily.get('movement') ?? 0}
            sub="scoreable today"
          />
          <StatTile
            label="Other families"
            value={sheets.length - (byFamily.get('movement') ?? 0)}
            sub="no renderer yet"
          />
          <StatTile label="Governing bodies" value={byBody.size} />
        </div>
      </section>

      <section aria-label="Test sheets" className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-hunter-deep">All sheets</h2>

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="sr-only">
              Platform scoring catalog: every test sheet, its level, discipline and family
            </caption>
            <thead>
              <tr className="bg-hunter-pale">
                {['Title', 'Level', 'Discipline', 'Governing body', 'Family'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="text-fa-muted px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheets.map((sheet) => (
                <tr key={sheet.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold text-hunter-deep">{sheet.title}</td>
                  <td className="text-fa-muted px-3 py-2.5">{sheet.level ?? '—'}</td>
                  <td className="text-fa-muted px-3 py-2.5">{sheet.discipline ?? '—'}</td>
                  <td className="text-fa-muted px-3 py-2.5">
                    {sheet.governing_body ?? 'Independent'}
                  </td>
                  <td className="px-3 py-2.5">
                    {sheet.family === 'movement' ? (
                      <StatusBadge tone="success">Movement</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">
                        {sheet.family === 'unassigned'
                          ? 'Unassigned'
                          : `${(sheet.family ?? '').charAt(0).toUpperCase()}${(sheet.family ?? '').slice(1)} — no renderer`}
                      </StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
