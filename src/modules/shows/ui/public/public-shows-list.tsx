import Link from 'next/link';
import { formatDateRange } from '@/shared/lib/format/date';
import type { PublicShowListItem } from '@/modules/shows/data/public-queries';

export function PublicShowsList({ shows }: { shows: PublicShowListItem[] }) {
  return (
    <div className="fa-public bg-cream min-h-dvh font-[family-name:var(--font-ar)]">
      <header className="bg-[#1F3A2E] text-white">
        <div className="mx-auto max-w-[880px] px-5 py-9">
          <div className="text-[11px] tracking-[0.14em] text-[#9FB4A7] uppercase">
            Field <span className="text-[#C9A227]">&amp;</span> Arena
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-nr)] text-2xl leading-tight font-semibold sm:text-[28px]">
            Browse shows
          </h1>
          <p className="mt-1 text-[13.5px] text-[#C7D6CC]">
            Every published show — pick one to view classes and enter.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-5 py-10">
        {shows.length === 0 ? (
          <p className="text-fa-muted text-[14px] italic">
            No shows are published yet — check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {shows.map((show) => (
              <Link
                key={show.id}
                href={`/show/${show.id}`}
                className="border-line bg-paper hover:border-forest/40 flex items-center gap-4 rounded-[14px] border px-5 py-4 transition-colors"
              >
                {show.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={show.logoUrl}
                    alt=""
                    className="h-12 w-12 flex-none rounded-[8px] bg-[#F2F0E7] object-contain p-1"
                  />
                ) : (
                  <div className="h-12 w-12 flex-none rounded-[8px] bg-[#F2F0E7]" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-forest text-[15px] font-medium">{show.name}</div>
                  <div className="text-fa-muted mt-0.5 text-[12.5px]">
                    {[
                      show.dateLabel ?? formatDateRange(show.startDate, show.endDate),
                      show.venueName,
                      show.orgName,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Details coming soon'}
                  </div>
                </div>
                <span className="text-forest flex-none text-[13px] font-semibold">View →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
