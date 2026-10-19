'use client';

import { useState } from 'react';
import { QUAL_TYPE_PRESETS } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/types';
import { useAddQualTypePreset } from '@/modules/shows/hooks/use-select-events-mutations';
import { FmSetDialog } from '@/modules/shows/ui/show-manager/fm-set-dialog';
import { TocDialog } from '@/modules/shows/ui/show-manager/toc-dialog';
import { CustomClassDialog } from '@/modules/shows/ui/show-manager/custom-class-dialog';

/** Secondary row under the Offered classes header: the extra class sources
 * (Test of Choice, custom, Independent templates) and qualification presets. */
export function EventSourceButtons({ data }: { data: SelectEventsData }) {
  const [independentOpen, setIndependentOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const addQual = useAddQualTypePreset();

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--fa-line-soft)] px-5 py-2.5">
        <div className="fa-quick-add">
          <span className="fa-qa-lab">Also add:</span>
          <button
            type="button"
            className="fa-chip"
            onClick={() => {
              setTocOpen(true);
            }}
          >
            + Test of Choice
          </button>
          <button
            type="button"
            className="fa-chip"
            onClick={() => {
              setCustomOpen(true);
            }}
          >
            + Custom class
          </button>
          <button
            type="button"
            className="fa-chip"
            onClick={() => {
              setIndependentOpen(true);
            }}
          >
            + Independent
          </button>
        </div>
        <div className="fa-quick-add">
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
      </div>

      {independentOpen && (
        <FmSetDialog
          setName="+ Independent"
          data={data}
          onClose={() => {
            setIndependentOpen(false);
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
