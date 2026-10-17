import type { Metadata } from 'next';
import { listAnnouncerHistory } from '@/modules/announcements/data/queries';
import { AnnouncerHistoryTable } from '@/modules/announcements/ui/announcer-history-table';
import { PageHeader } from '@/shared/ui/organizer/fa-page';

export const metadata: Metadata = { title: 'History — Field & Arena' };

export default async function AnnouncingHistoryPage() {
  const history = await listAnnouncerHistory();

  return (
    <>
      <PageHeader eyebrow="Shows you've announced" title="History" />
      <AnnouncerHistoryTable history={history} />
    </>
  );
}
