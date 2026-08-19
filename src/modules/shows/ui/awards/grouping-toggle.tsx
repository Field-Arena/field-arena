'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useUpdateScheduleRules } from '@/modules/shows/hooks/use-schedule-mutations';

export function GroupingToggle({ showId, byDivision }: { showId: string; byDivision: boolean }) {
  const save = useUpdateScheduleRules();

  const base =
    'h-auto rounded-none px-[15px] py-[9px] text-[13px] font-bold transition-colors disabled:opacity-60 first:rounded-l-[10px] last:rounded-r-[10px]';

  return (
    <div className="inline-flex overflow-hidden rounded-[10px] border border-[#D9E1DD]">
      <Button
        type="button"
        variant="ghost"
        disabled={save.isPending}
        className={cn(
          base,
          byDivision
            ? 'text-forest hover:text-forest bg-white hover:bg-white'
            : 'bg-forest hover:bg-forest text-white hover:text-white',
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
            ? 'bg-forest hover:bg-forest text-white hover:text-white'
            : 'text-forest hover:text-forest bg-white hover:bg-white',
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
