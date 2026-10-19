'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useUpdateScheduleRules } from '@/modules/shows/hooks/use-schedule-mutations';

export function GroupingToggle({ showId, byDivision }: { showId: string; byDivision: boolean }) {
  const save = useUpdateScheduleRules();

  const base =
    'h-auto rounded-none px-[15px] py-[9px] text-[13px] font-bold transition-colors disabled:opacity-60 first:rounded-l-[10px] last:rounded-r-[10px]';

  return (
    <div className="inline-flex overflow-hidden rounded-[10px] border border-[#E7EAEE]">
      <Button
        type="button"
        variant="ghost"
        disabled={save.isPending}
        className={cn(
          base,
          byDivision
            ? 'bg-white text-[#101828] hover:bg-white hover:text-[#146A47]'
            : 'bg-[#146A47] text-white hover:bg-[#0E5537] hover:text-white',
        )}
        onClick={() => {
          if (byDivision) save.mutate({ showId, awardsByDivision: false });
        }}
      >
        By Test
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={save.isPending}
        title="Splits ribbons per rider division within each award unit — Junior, Young Rider, Adult Amateur and Open place separately."
        className={cn(
          base,
          byDivision
            ? 'bg-[#146A47] text-white hover:bg-[#0E5537] hover:text-white'
            : 'bg-white text-[#101828] hover:bg-white hover:text-[#146A47]',
        )}
        onClick={() => {
          if (!byDivision) save.mutate({ showId, awardsByDivision: true });
        }}
      >
        By Division
      </Button>
    </div>
  );
}
