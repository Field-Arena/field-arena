import type { Metadata } from 'next';
import { listBookableShows } from '@/modules/vendors/data/queries';
import { formatMoney } from '@/shared/lib/format/currency';
import { VendorApplyDialog } from '@/modules/vendors/ui/vendor-apply-dialog';
import {
  CardTitle,
  EmptyState,
  FA_MUTED,
  FaCard,
  PageHeader,
  Pill,
} from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'Reserve Space — Field & Arena' };

export default async function VendorDiscoverPage() {
  const shows = await listBookableShows();

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow="Shows with booth space still available, across every organizer"
        title="Reserve Space"
      />

      {shows.length === 0 ? (
        <EmptyState
          title="Nothing available"
          note="No published show currently has vendor space on sale."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {shows.map((show) => (
            <FaCard key={show.showId} className="flex flex-col">
              <CardTitle>{show.showName}</CardTitle>
              <p className={FA_MUTED}>
                {show.orgName}
                {show.showDate && ` · ${show.showDate}`}
              </p>

              <ul className="my-3 list-none space-y-2 p-0">
                {show.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="min-w-0">
                      <span className="font-semibold">{item.name}</span>
                      <span className="ml-2 text-[#5A6B63]">{formatMoney(item.price)}</span>
                    </span>
                    {item.remaining === null ? (
                      <Pill tone="green">Unlimited</Pill>
                    ) : (
                      <Pill tone={item.remaining > 0 ? 'blue' : 'red'}>
                        {String(item.remaining)} left
                      </Pill>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex justify-end border-t border-[#EDF0EE] pt-3">
                <VendorApplyDialog show={show} />
              </div>
            </FaCard>
          ))}
        </div>
      )}
    </div>
  );
}
