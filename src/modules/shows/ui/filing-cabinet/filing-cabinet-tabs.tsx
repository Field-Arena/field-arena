import { Chip, ChipRow } from '@/shared/ui/organizer/fa-page';
import { FILING_CABINET_SECTIONS, type FilingCabinetSectionKey } from '@/modules/shows/constants';

export function FilingCabinetTabs({
  activeKey,
  showId,
}: {
  activeKey: FilingCabinetSectionKey;
  showId: string | null;
}) {
  return (
    <nav aria-label="Filing cabinet sections" className="mb-1">
      <ChipRow>
        {FILING_CABINET_SECTIONS.map((s) =>
          s.status === 'soon' || !showId ? (
            <span
              key={s.key}
              aria-disabled="true"
              title={s.status === 'soon' ? 'Coming soon' : undefined}
              className="cursor-not-allowed rounded-full border-2 border-[#E1E7E4] bg-white px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-[#98A29D]"
            >
              {s.label}
            </span>
          ) : (
            <Chip
              key={s.key}
              active={s.key === activeKey}
              href={`/dashboard/documents/${s.key}?show=${showId}`}
            >
              {s.label}
            </Chip>
          ),
        )}
      </ChipRow>
    </nav>
  );
}
