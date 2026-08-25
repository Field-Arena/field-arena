import type { Metadata } from 'next';
import { listBookableShows } from '@/modules/vendors/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { formatMoney } from '@/shared/lib/format/currency';
import { VendorApplyDialog } from '@/modules/vendors/ui/vendor-apply-dialog';

export const metadata: Metadata = { title: 'Reserve Space — Field & Arena' };

export default async function VendorDiscoverPage() {
  const shows = await listBookableShows();

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Reserve Space</h1>
          <p>Shows with booth space still available, across every organizer.</p>
        </div>
      </div>

      <div className="dash-card">
        {shows.length === 0 ? (
          <EmptyPanel
            title="Nothing available"
            note="No published show currently has vendor space on sale."
          />
        ) : (
          shows.map((show) => (
            <div key={show.showId} className="discover-card">
              <div className="discover-top">
                <div>
                  <div className="discover-name">{show.showName}</div>
                  <div className="discover-meta">
                    {show.orgName}
                    {show.showDate && ` · ${show.showDate}`}
                  </div>
                </div>
                <VendorApplyDialog show={show} />
              </div>
              <div className="space-grid">
                {show.items.map((item) => (
                  <div key={item.id} className="space-opt">
                    <div className="sname">{item.name}</div>
                    <div className="sprice">{formatMoney(item.price)}</div>
                    <div className="savail">
                      {item.remaining === null ? 'Unlimited' : `${String(item.remaining)} left`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
