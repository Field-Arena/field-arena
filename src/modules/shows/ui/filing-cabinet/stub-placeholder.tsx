import { EmptyState } from '@/shared/ui/organizer/fa-page';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

export function StubPlaceholder({ label }: { label: string }) {
  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <CabinetSectionHead title={label} lede="This part of the filing cabinet isn't built yet." />
      <EmptyState title="Coming soon" />
    </div>
  );
}
