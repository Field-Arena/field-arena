'use client';

import { useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { FA_BTN_SMALL, FA_INPUT, FA_MUTED } from '@/shared/ui/organizer/fa-page';
import {
  useUpdateStableField,
  useGenerateStableStalls,
} from '@/modules/shows/hooks/use-stable-chart-mutations';
import type { StableChartStable } from '@/modules/shows/data/stable-chart-queries';

export function StableConfigRow({ showId, stable }: { showId: string; stable: StableChartStable }) {
  const stallCountRef = useRef<HTMLInputElement>(null);
  const updateField = useUpdateStableField();
  const generate = useGenerateStableStalls();

  return (
    <div className="flex flex-wrap items-end gap-2.5 border-t border-[#EDF0EE] py-2.5 first:border-t-0">
      <div className="min-w-[140px] flex-1">
        <label className={cn(FA_MUTED, 'mb-1 block')}>Stable name</label>
        <input
          key={`${stable.id}-name`}
          defaultValue={stable.name}
          className={cn(FA_INPUT, 'w-full py-1.5')}
          onBlur={(event) => {
            const value = event.target.value.trim();
            if (value && value !== stable.name) {
              updateField.mutate({ showId, stableId: stable.id, name: value });
            }
          }}
        />
      </div>

      <div className="w-[120px]">
        <label className={cn(FA_MUTED, 'mb-1 block')}>Stalls in this stable</label>
        <input
          key={`${stable.id}-count`}
          ref={stallCountRef}
          type="number"
          min={0}
          defaultValue={stable.stallCount}
          className={cn(FA_INPUT, 'w-full py-1.5')}
          onBlur={(event) => {
            const value = Math.max(0, parseInt(event.target.value, 10) || 0);
            if (value !== stable.stallCount) {
              updateField.mutate({ showId, stableId: stable.id, stallCount: value });
            }
          }}
        />
      </div>

      <div className="w-[120px]">
        <label className={cn(FA_MUTED, 'mb-1 block')}>Rows in this stable</label>
        <input
          key={`${stable.id}-rows`}
          type="number"
          min={1}
          defaultValue={stable.rowCount}
          className={cn(FA_INPUT, 'w-full py-1.5')}
          onBlur={(event) => {
            const value = Math.max(1, parseInt(event.target.value, 10) || 1);
            if (value !== stable.rowCount) {
              updateField.mutate({ showId, stableId: stable.id, rowCount: value });
            }
          }}
        />
      </div>

      <button
        type="button"
        disabled={generate.isPending}
        className={cn(FA_BTN_SMALL, 'mb-1')}
        onClick={() => {
          const raw = stallCountRef.current?.value ?? String(stable.stallCount);
          const stallCount = Math.max(0, parseInt(raw, 10) || 0);
          generate.mutate({ showId, stableId: stable.id, stallCount });
        }}
      >
        {stable.stalls.length ? 'Update stalls' : 'Generate stalls'}
      </button>
    </div>
  );
}
