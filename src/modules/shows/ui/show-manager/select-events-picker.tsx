'use client';

import { useState } from 'react';
import { ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import {
  CATALOG_CATEGORIES,
  DEFAULT_CLASS_FEE,
  defaultArenaFor,
  groupsFor,
  type CatalogCategory,
} from '../../constants';
import type { SelectEventsData } from '../../data/setup-queries';
import {
  useAddCatalogGroup,
  useRemoveCatalogGroup,
} from '../../hooks/use-select-events-mutations';
import { EventSourceButtons } from './event-source-buttons';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_SELECT } from './tokens';

/**
 * "Select Events" — the catalog an organizer picks their classes from.
 *
 * A group is the unit, not a test: checking "Training Level" creates one class
 * per test in it, all sharing the group as their division so the level's
 * placings pool. That is why every row shows a test count rather than expanding
 * into individually selectable tests.
 *
 * Whether a group is on the show is derived from the classes that exist, not
 * from local state — so the checkbox reflects the database even after a
 * navigation, and re-checking an already-added group is a no-op rather than a
 * duplicate.
 */
export function SelectEventsPicker({ data }: { data: SelectEventsData }) {
  const chosen = new Set(data.classes.map((c) => c.division).filter((d): d is string => !!d));

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Select Events</h2>
      <p className={SM_NOTE}>
        Set a default ticket price per category, then check off classes below — each level sets its
        own arena size. Fee overrides and locations are editable any time.
      </p>

      <EventSourceButtons data={data} />

      <div className="flex flex-col gap-6">
        {CATALOG_CATEGORIES.map((category) => (
          <CategoryBlock
            key={category}
            category={category}
            data={data}
            chosen={chosen}
          />
        ))}
      </div>
    </Card>
  );
}

function CategoryBlock({
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
        <h3 className="text-[14px] font-bold text-forest">{category}</h3>
        <label className="ml-auto flex items-center gap-2 text-[12.5px] text-[#6E7C76]">
          Default price ($)
          <input
            type="number"
            min={0}
            step="1"
            value={fee}
            onChange={(e) => {
              setFee(Number(e.target.value));
            }}
            className="w-[76px] rounded-[8px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-ink-deep outline-none focus-visible:border-gold"
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

function GroupRow({
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
  // Seeded from a class this group already created, so the dropdown shows what
  // was actually saved rather than resetting to "No location set" on reload.
  const [location, setLocation] = useState(
    data.classes.find((c) => c.division === group)?.location ?? ''
  );

  const add = useAddCatalogGroup();
  const remove = useRemoveCatalogGroup();
  const pending = add.isPending || remove.isPending;

  function toggle() {
    if (selected) {
      remove.mutate({ showId: data.showId, group });
    } else {
      add.mutate({ showId: data.showId, category, group, tests: [...tests], fee, location });
    }
  }

  return (
    <div
      className={cn(
        'rounded-[10px] border bg-white transition-colors',
        selected ? 'border-[#BEDDCB] bg-[#F6FBF8]' : 'border-[#EDF0EE]'
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          aria-label={expanded ? `Hide ${group} tests` : `Show ${group} tests`}
          className="flex-none rounded p-0.5 text-[#7A8781] transition-transform hover:text-forest"
        >
          <ChevronRightIcon
            className={cn('size-4 transition-transform', expanded && 'rotate-90')}
            aria-hidden
          />
        </button>

        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={selected}
            disabled={pending}
            onChange={toggle}
            className="size-4 flex-none accent-[#1A5B3C]"
          />
          <span className="truncate text-[13.5px] font-semibold text-ink-deep">{group}</span>
          {pending && <Loader2Icon className="size-3.5 flex-none animate-spin" aria-hidden />}
        </label>

        <select
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
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
          <p className="mb-2 text-[11.5px] text-[#98A29D]">
            {defaultArenaFor(category, group)}
          </p>
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
