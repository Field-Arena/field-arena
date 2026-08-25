import Link from 'next/link';
import { formatMoney } from '@/shared/lib/format/currency';
import { ROUTES } from '@/shared/constants/routes';
import type { PublicShowClass, PublicShowPageData } from '@/modules/shows/data/public-queries';

function groupByDivision(classes: PublicShowClass[]): { division: string; classes: PublicShowClass[] }[] {
  const order: string[] = [];
  const byDivision = new Map<string, PublicShowClass[]>();
  for (const c of classes) {
    const key = c.division ?? 'General';
    if (!byDivision.has(key)) {
      byDivision.set(key, []);
      order.push(key);
    }
    byDivision.get(key)?.push(c);
  }
  return order.map((division) => ({ division, classes: byDivision.get(division) ?? [] }));
}

export function PublicShowPage({ data }: { data: PublicShowPageData }) {
  const enterHref = `/rider/shows/${data.id}`;
  const groups = groupByDivision(data.classes);

  return (
    <div className="fa-public bg-cream min-h-dvh font-[family-name:var(--font-ar)]">
      <header className="bg-[#1F3A2E] text-white">
        <div className="mx-auto max-w-[880px] px-5 pt-6">
          <Link
            href={ROUTES.browseShows}
            className="text-[12.5px] font-medium text-[#9FB4A7] hover:text-white"
          >
            ← All shows
          </Link>
        </div>
        <div className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pt-3 pb-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt=""
                className="h-14 w-14 flex-none rounded-[10px] bg-white/10 object-contain p-1"
              />
            ) : null}
            <div className="min-w-0">
              <div className="text-[11px] tracking-[0.14em] text-[#9FB4A7] uppercase">
                Field <span className="text-[#C9A227]">&amp;</span> Arena
              </div>
              <h1 className="mt-1 font-[family-name:var(--font-nr)] text-2xl leading-tight font-semibold sm:text-[28px]">
                {data.name}
              </h1>
              <p className="mt-1 text-[13.5px] text-[#C7D6CC]">
                {[data.dateLabel, data.venueName, data.orgName].filter(Boolean).join(' · ') ||
                  'Details coming soon'}
              </p>
            </div>
          </div>
          <Link
            href={enterHref}
            className="inline-flex flex-none items-center justify-center rounded-[10px] bg-[#C9A227] px-6 py-3 text-[14px] font-semibold text-[#1F3A2E] transition-colors hover:bg-[#d9b53c]"
          >
            Enter this show
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-5 py-10">
        {(data.prizeListUrl ?? data.website ?? data.contactEmail ?? data.phone) && (
          <div className="border-line bg-paper mb-8 flex flex-wrap gap-x-6 gap-y-2 rounded-[14px] border px-5 py-4 text-[13.5px]">
            {data.prizeListUrl && (
              <a
                href={data.prizeListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest font-semibold underline underline-offset-2"
              >
                Prize list (PDF)
              </a>
            )}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest font-semibold underline underline-offset-2"
              >
                Website
              </a>
            )}
            {data.contactEmail && (
              <a
                href={`mailto:${data.contactEmail}`}
                className="text-fa-muted hover:text-forest"
              >
                {data.contactEmail}
              </a>
            )}
            {data.phone && <span className="text-fa-muted">{data.phone}</span>}
          </div>
        )}

        <h2 className="text-forest mb-4 font-[family-name:var(--font-nr)] text-xl font-medium">
          Classes &amp; divisions
        </h2>

        {data.classes.length === 0 ? (
          <p className="text-fa-muted text-[14px] italic">
            The class list for this show hasn&apos;t been published yet — check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.division}>
                <h3 className="text-fa-muted mb-2 text-[12px] font-semibold tracking-[0.08em] uppercase">
                  {group.division}
                </h3>
                <div className="border-line bg-paper divide-line divide-y rounded-[14px] border">
                  {group.classes.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-forest text-[14px] font-medium">{c.label}</div>
                        {c.sponsor && (
                          <div className="text-fa-muted text-[12px]">Presented by {c.sponsor}</div>
                        )}
                      </div>
                      <div className="text-forest flex-none text-[14px] font-semibold">
                        {formatMoney(c.fee)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Link
            href={enterHref}
            className="inline-flex items-center justify-center rounded-[10px] bg-[#1F3A2E] px-8 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#284b3b]"
          >
            Enter this show
          </Link>
          <p className="text-fa-muted text-[12.5px]">
            Entries are made right here on Field &amp; Arena — sign in or create a rider account to
            begin.
          </p>
        </div>
      </main>
    </div>
  );
}
