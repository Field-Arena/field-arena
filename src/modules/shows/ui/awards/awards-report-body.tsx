import { Card, Eyebrow } from '@/shared/ui/organizer/card';
import type { AwardsReport } from '@/modules/shows/awards-engine';
import { RibbonChips } from '@/modules/shows/ui/awards/ribbon-chips';
import { LevelCard } from '@/modules/shows/ui/awards/level-card';

export function AwardsReportBody({
  report,
  ribbonTotal,
  groupedByLabel,
}: {
  report: AwardsReport;
  ribbonTotal: number;
  groupedByLabel: string;
}) {
  return (
    <>
      <Card className="mb-[22px] grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 p-[16px_20px_18px] print:break-inside-avoid">
        <div className="flex flex-col gap-[5px] border-r border-[#EEF2F0] pr-6">
          <Eyebrow>Ribbons to bring</Eyebrow>
          <span className="text-[31px] leading-none font-bold tracking-[-.028em] text-[#16261F]">
            {ribbonTotal}
          </span>

          <span className="text-[12px] text-[#98A29D]">
            per class/pool, see below · grouped by {groupedByLabel}
          </span>
        </div>
        <RibbonChips maxPlaces={report.maxPlaces} tally={report.tally} />
      </Card>

      {report.levels.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781]">No scores entered yet.</p>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {report.levels.map((level) => (
            <LevelCard key={level.level} level={level} />
          ))}
        </div>
      )}
    </>
  );
}
