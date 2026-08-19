'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { EVENT_SOURCE_BUTTONS, QUAL_TYPE_PRESETS, type FmSetName } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import { useAddQualTypePreset } from '@/modules/shows/hooks/use-select-events-mutations';
import { FmSetDialog } from '@/modules/shows/ui/show-manager/fm-set-dialog';
import { TocDialog } from '@/modules/shows/ui/show-manager/toc-dialog';
import { CustomClassDialog } from '@/modules/shows/ui/show-manager/custom-class-dialog';

const PILL =
  'rounded-full border border-[#D9E1DD] bg-white px-[15px] py-2 text-[12.5px] font-semibold ' +
  'text-[#16261F] transition-colors hover:border-[#16261F] disabled:opacity-60';

export function EventSourceButtons({ data }: { data: SelectEventsData }) {
  const [fmSet, setFmSet] = useState<FmSetName | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const addQual = useAddQualTypePreset();

  return (
    <>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {EVENT_SOURCE_BUTTONS.map((name) => (
          <Button
            key={name}
            type="button"
            variant="ghost"
            className={cn('h-auto', PILL, 'hover:bg-white')}
            onClick={() => {
              if (name === '+ Test of Choice (TOC)') setTocOpen(true);
              else if (name === '+ Add Custom Class') setCustomOpen(true);
              else setFmSet(name);
            }}
          >
            {name}
          </Button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {QUAL_TYPE_PRESETS.map(({ body, price }) => (
          <Button
            key={body}
            type="button"
            variant="ghost"
            className={cn('h-auto', PILL, 'hover:bg-white')}
            disabled={addQual.isPending}
            onClick={() => {
              addQual.mutate({ showId: data.showId, body, price });
            }}
          >
            + {body} (${price})
          </Button>
        ))}
      </div>

      {fmSet && (
        <FmSetDialog
          key={fmSet}
          setName={fmSet}
          data={data}
          onClose={() => {
            setFmSet(null);
          }}
        />
      )}
      {tocOpen && (
        <TocDialog
          data={data}
          onClose={() => {
            setTocOpen(false);
          }}
        />
      )}
      {customOpen && (
        <CustomClassDialog
          data={data}
          onClose={() => {
            setCustomOpen(false);
          }}
        />
      )}
    </>
  );
}
