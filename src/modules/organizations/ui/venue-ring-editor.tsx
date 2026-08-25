'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { RING_SIZES, MAX_RINGS } from '@/modules/organizations/constants';
import {
  VT_LABEL,
  VT_INPUT,
  VT_ROW_INPUT,
  VT_SECTION_LABEL,
} from '@/modules/organizations/ui/venue-tokens';
import type { VenueRing } from '@/modules/organizations/types';

export function VenueRingEditor({
  rings,
  onSetCount,
  onRename,
  onResize,
}: {
  rings: VenueRing[];
  onSetCount: (raw: string) => void;
  onRename: (index: number, name: string) => void;
  onResize: (index: number, size: VenueRing['size']) => void;
}) {
  return (
    <div>
      <label className={VT_SECTION_LABEL}>Rings / arenas at this location</label>
      <div className="mb-2.5 max-w-[160px]">
        <label htmlFor="vf-ring-count" className={VT_LABEL}>
          Number of rings/arenas
        </label>
        <Input
          id="vf-ring-count"
          type="number"
          min={0}
          max={MAX_RINGS}
          value={rings.length}
          className={`h-auto ${VT_INPUT}`}
          onChange={(e) => {
            onSetCount(e.target.value);
          }}
        />
      </div>

      {rings.length === 0 ? (
        <p className="mb-1 text-[13px] text-[#7A8781] italic">No rings yet — add at least one</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rings.map((ring, i) => (
            <div key={i} className="grid grid-cols-[22px_minmax(0,1fr)_170px] items-center gap-2.5">
              <span className="text-forest text-[13px] font-bold">{i + 1}</span>
              <Input
                value={ring.name}
                placeholder="e.g. Ring 1, Warm-up Ring"
                className={`h-auto ${VT_ROW_INPUT}`}
                onChange={(e) => {
                  onRename(i, e.target.value);
                }}
              />
              <select
                value={ring.size}
                className={VT_ROW_INPUT + ' appearance-none'}
                onChange={(e) => {
                  onResize(i, e.target.value as VenueRing['size']);
                }}
              >
                {RING_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
