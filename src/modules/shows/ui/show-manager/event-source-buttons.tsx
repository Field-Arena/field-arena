'use client';

import { useState } from 'react';
import { EVENT_SOURCE_BUTTONS, QUAL_TYPE_PRESETS, type FmSetName } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/types';
import { useAddQualTypePreset } from '@/modules/shows/hooks/use-select-events-mutations';
import { FmSetDialog } from '@/modules/shows/ui/show-manager/fm-set-dialog';
import { TocDialog } from '@/modules/shows/ui/show-manager/toc-dialog';
import { CustomClassDialog } from '@/modules/shows/ui/show-manager/custom-class-dialog';

const SET_TINT: Record<string, string> = {
  '+ FEI': '#C0367A',
  '+ USEF/USDF': '#0B6BB8',
  '+ Independent': '#146A47',
};

export function EventSourceButtons({ data }: { data: SelectEventsData }) {
  const [fmSet, setFmSet] = useState<FmSetName | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const addQual = useAddQualTypePreset();

  const setButtons = EVENT_SOURCE_BUTTONS.filter(
    (n) => n !== '+ Test of Choice (TOC)' && n !== '+ Add Custom Class',
  );

  return (
    <>
      <div className="fa-quick-add">
        <span className="fa-qa-lab">Add all:</span>
        {setButtons.map((name) => (
          <button
            key={name}
            type="button"
            className="fa-qa-btn"
            style={{ background: SET_TINT[name] ?? 'var(--fa-brand)' }}
            onClick={() => {
              setFmSet(name);
            }}
          >
            {name.replace('+ ', '')}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--fa-line)]" aria-hidden />
        <button
          type="button"
          className="fa-chip-add"
          onClick={() => {
            setTocOpen(true);
          }}
        >
          + Test of Choice
        </button>
        <button
          type="button"
          className="fa-chip-add"
          onClick={() => {
            setCustomOpen(true);
          }}
        >
          + Custom class
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--fa-line)]" aria-hidden />
        <span className="fa-qa-lab">Qualifications:</span>
        {QUAL_TYPE_PRESETS.map(({ body, price }) => (
          <button
            key={body}
            type="button"
            className="fa-chip"
            disabled={addQual.isPending}
            onClick={() => {
              addQual.mutate({ showId: data.showId, body, price });
            }}
          >
            + {body} <span className="fa-ct">${price}</span>
          </button>
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
