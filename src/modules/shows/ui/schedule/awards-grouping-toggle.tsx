'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import type { MasterScheduleData } from '@/modules/shows/data/setup-queries';
import { useUpdateScheduleRules } from '@/modules/shows/hooks/use-schedule-mutations';

const BASE =
  'h-auto rounded-none px-3 py-1.5 text-[12.5px] font-semibold transition-colors first:rounded-l-[9px] last:rounded-r-[9px] hover:bg-transparent';

/** "Awards grouping" — By Test or By Division, flipped from the schedule. */
export function AwardsGroupingToggle({ data }: { data: MasterScheduleData }) {
  const save = useUpdateScheduleRules();
  const byDivision = data.rules.awardsByDivision;

  return (
    <div className="inline-flex overflow-hidden rounded-[9px] border border-[#D9E1DD]">
      <Button
        type="button"
        variant="ghost"
        className={cn(BASE, byDivision ? 'bg-white text-forest' : 'bg-forest text-white')}
        onClick={() => {
          if (byDivision) save.mutate({ showId: data.showId, awardsByDivision: false });
        }}
      >
        By Test
      </Button>
      <Button
        type="button"
        variant="ghost"
        title="Splits ribbons per division within a class — e.g. Young Rider, Adult Amateur, Open each place separately."
        className={cn(BASE, byDivision ? 'bg-forest text-white' : 'bg-white text-forest')}
        onClick={() => {
          if (!byDivision) save.mutate({ showId: data.showId, awardsByDivision: true });
        }}
      >
        By Division
      </Button>
    </div>
  );
}
