import { Card } from '@/shared/ui/organizer/card';
import type { AwardLevel } from '@/modules/shows/awards-engine';
import { SectionBox } from '@/modules/shows/ui/awards/section-box';

export function LevelCard({ level }: { level: AwardLevel }) {
  return (
    <Card className="overflow-hidden print:break-inside-avoid">
      <div className="flex items-baseline gap-3 border-b border-[#E7EAEE] px-[18px] py-[13px]">
        <h2 className="font-[family-name:var(--font-nr)] text-[21px] font-semibold tracking-[-.012em] text-[#101828]">
          {level.level}
        </h2>
        <span className="ml-auto text-[11.5px] font-bold tracking-[.12em] text-[#8A94A3] uppercase">
          {level.classCount} class{level.classCount === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))]">
        {level.sections.map((section, i) => (
          <SectionBox key={`${section.title}-${String(i)}`} section={section} />
        ))}
      </div>
    </Card>
  );
}
