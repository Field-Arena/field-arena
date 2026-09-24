'use client';

import { useState } from 'react';
import { ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import { defaultArenaFor, type CatalogCategory } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import {
  useAddCatalogGroup,
  useRemoveCatalogGroup,
  useUpdateGroupLocation,
  useUpdateGroupDivision,
} from '@/modules/shows/hooks/use-select-events-mutations';
import { SM_SELECT } from '@/modules/shows/ui/show-manager/tokens';

export function GroupRow({
  category,
  group,
  tests,
  fee,
  data,
  selected,
}: {
  category: CatalogCategory;
  group: string;
  tests: readonly string[];
  fee: number;
  data: SelectEventsData;
  selected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const [location, setLocation] = useState(
    data.classes.find((c) => c.groupName === group)?.location ?? '',
  );
  const [division, setDivision] = useState(
    data.classes.find((c) => c.groupName === group)?.division ?? '',
  );

  const add = useAddCatalogGroup();
  const remove = useRemoveCatalogGroup();
  const updateLocation = useUpdateGroupLocation();
  const updateDivision = useUpdateGroupDivision();
  const pending = add.isPending || remove.isPending;

  const pickedDivisionFee = data.divisions.find((d) => d.name === division)?.defaultFee;

  function toggle() {
    if (selected) {
      remove.mutate({ showId: data.showId, group });
    } else {
      add.mutate({
        showId: data.showId,
        category,
        group,
        division: division || undefined,
        tests: [...tests],
        fee: pickedDivisionFee ?? fee,
        location,
      });
    }
  }

  return (
    <div
      className={cn(
        'rounded-[10px] border bg-white transition-colors',
        selected ? 'border-[#BEDDCB] bg-[#F6FBF8]' : 'border-[#EDF0EE]',
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          aria-label={expanded ? `Hide ${group} tests` : `Show ${group} tests`}
          className="hover:text-forest h-auto flex-none rounded p-0.5 text-[#7A8781] transition-transform hover:bg-transparent"
        >
          <ChevronRightIcon
            className={cn('size-4 transition-transform', expanded && 'rotate-90')}
            aria-hidden
          />
        </Button>

        <Label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={selected}
            disabled={pending}
            onChange={toggle}
            className="size-4 flex-none accent-[#1A5B3C]"
          />
          <span className="text-ink-deep truncate text-[13.5px] font-semibold">{group}</span>
          {pending && <Loader2Icon className="size-3.5 flex-none animate-spin" aria-hidden />}
        </Label>

        <select
          value={division}
          onChange={(e) => {
            const next = e.target.value;
            setDivision(next);
            if (selected) updateDivision.mutate({ showId: data.showId, group, division: next });
          }}
          aria-label={`Division for ${group}`}
          className={cn(SM_SELECT, 'w-auto min-w-[140px] flex-none py-2 text-[13px]')}
        >
          <option value="">No division set</option>
          {data.divisions.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => {
            const next = e.target.value;
            setLocation(next);
            if (selected) updateLocation.mutate({ showId: data.showId, group, location: next });
          }}
          aria-label={`Location for ${group}`}
          className={cn(SM_SELECT, 'w-auto min-w-[150px] flex-none py-2 text-[13px]')}
        >
          <option value="">No location set</option>
          {data.ringNames.map((ring) => (
            <option key={ring} value={ring}>
              {ring}
            </option>
          ))}
        </select>

        <span className="w-[58px] flex-none text-right text-[12.5px] text-[#98A29D]">
          {tests.length} tests
        </span>
      </div>

      {expanded && (
        <div className="border-t border-[#EDF0EE] px-3.5 py-2.5">
          <p className="mb-2 text-[11.5px] text-[#98A29D]">{defaultArenaFor(category, group)}</p>
          <ul className="flex flex-col gap-1">
            {tests.map((test) => (
              <li key={test} className="text-[12.5px] text-[#5A6B63]">
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
