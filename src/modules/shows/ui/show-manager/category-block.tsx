'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { blockNonDecimalKeys } from '@/shared/lib/format/number-input';
import { DEFAULT_CLASS_FEE, groupsFor, type CatalogCategory } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/types';
import { GroupRow } from '@/modules/shows/ui/show-manager/group-row';

export function CategoryBlock({
  category,
  data,
  chosen,
}: {
  category: CatalogCategory;
  data: SelectEventsData;
  chosen: Set<string>;
}) {
  const [fee, setFee] = useState(DEFAULT_CLASS_FEE);

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center gap-3">
        <h3 className="text-[14px] font-bold text-[#101828]">{category}</h3>
        <Label className="ml-auto flex items-center gap-2 text-[12.5px] text-[#8A94A3]">
          Default price ($)
          <Input
            type="number"
            min={0}
            max={100000}
            step="1"
            onKeyDown={blockNonDecimalKeys}
            value={fee}
            onChange={(e) => {
              setFee(Number(e.target.value));
            }}
            className="h-auto w-[76px] rounded-[8px] border border-[#E7EAEE] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#101828] outline-none focus-visible:border-[#9FD3BA]"
            aria-label={`Default price for ${category}`}
          />
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        {groupsFor(category).map(({ group, tests }) => (
          <GroupRow
            key={group}
            category={category}
            group={group}
            tests={tests}
            fee={fee}
            data={data}
            selected={chosen.has(group)}
          />
        ))}
      </div>
    </section>
  );
}
