import { TabStrip, type TabStripSection } from '@/shared/ui/organizer/tab-strip';
import { FILING_CABINET_SECTIONS, type FilingCabinetSectionKey } from '@/modules/shows/constants';

export function FilingCabinetTabs({
  activeKey,
  showId,
}: {
  activeKey: FilingCabinetSectionKey;
  showId: string | null;
}) {
  const sections: TabStripSection[] = FILING_CABINET_SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    href: `/dashboard/documents/${s.key}${showId ? `?show=${showId}` : ''}`,
    disabled: s.status === 'soon' || !showId,
  }));

  return <TabStrip sections={sections} activeKey={activeKey} />;
}
