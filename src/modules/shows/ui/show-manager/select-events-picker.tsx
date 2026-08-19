'use client';

import { Card } from '@/shared/ui/organizer/card';
import { CATALOG_CATEGORIES } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import { EventSourceButtons } from '@/modules/shows/ui/show-manager/event-source-buttons';
import { CategoryBlock } from '@/modules/shows/ui/show-manager/category-block';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';

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
          <CategoryBlock key={category} category={category} data={data} chosen={chosen} />
        ))}
      </div>
    </Card>
  );
}
