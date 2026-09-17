import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { FilingCabinetShell } from '@/modules/shows/ui/filing-cabinet/filing-cabinet-shell';
import { StubPlaceholder } from '@/modules/shows/ui/filing-cabinet/stub-placeholder';

export const metadata: Metadata = { title: 'Volunteers — Field & Arena' };

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  return (
    <FilingCabinetShell
      activeKey="volunteers"
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <StubPlaceholder label="Volunteers" />
    </FilingCabinetShell>
  );
}
