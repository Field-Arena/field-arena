import type { Metadata } from 'next';
import { listAnnouncerHistory } from '@/modules/announcements/data/queries';
import { AnnouncerHistoryTable } from '@/modules/announcements/ui/announcer-history-table';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function AnnouncingHistoryPage() {
  const history = await listAnnouncerHistory();

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>History</h1>
          <p>Shows you&apos;ve announced.</p>
        </div>
      </div>

      <div className="dash-card">
        <AnnouncerHistoryTable history={history} />
      </div>
    </>
  );
}
