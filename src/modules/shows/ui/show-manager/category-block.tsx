'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { DEFAULT_CLASS_FEE, groupsFor, type CatalogCategory } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
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
  // Per category, matching the design's one "Default price ($)" box per block.
  // Applied at the moment a group is added; changing it later does not reprice
  // classes already created, which is what the per-class fee editor is for.
  const [fee, setFee] = useState(DEFAULT_CLASS_FEE);

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center gap-3">
        <h3 className="text-forest text-[14px] font-bold">{category}</h3>
        <label className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Default price ($)
          <Input
            type="number"
            min={0}
            step="1"
            value={fee}
            onChange={(e) => {
              setFee(Number(e.target.value));
            }}
            className="text-ink-deep focus-visible:border-gold h-auto w-[76px] rounded-[8px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[13px] font-semibold outline-none"
            aria-label={`Default price for ${category}`}
          />
        </label>
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
