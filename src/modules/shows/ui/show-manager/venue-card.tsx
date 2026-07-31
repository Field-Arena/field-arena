'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RING_SIZES, MAX_RINGS } from '../../schemas';
import type { RingRow, VenueOption } from '../../data/setup-queries';
import { useUpdateShowLocations, useApplySavedVenue } from '../../hooks/use-show-mutations';
import { Card } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { IconBarn } from '@/shared/ui/organizer/icons';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_LABEL, SM_INPUT, SM_SELECT, SM_ROW_INPUT } from './tokens';

/**
 * "Venue" — ring/arena count, names, and sizes for this show, plus an
 * optional pick from the org's saved venue library.
 *
 * Scoped down from showstaff.html's own applySavedLocation: picking a saved
 * venue there also copies address/website/phone/contact into the show.
 * Venue and Contact are independently-edited cards here, so picking a venue
 * only copies its ring layout — see applySavedVenue and listVenuesForOrg in
 * data/*.ts for why that's a scope choice, not a data limitation.
 *
 * "Assign Judges" (per ring) and "Open Stable Chart" are both real,
 * separate features neither source has finished porting — the buttons stay
 * visible to match the design, but point at a toast rather than a route
 * that doesn't exist yet, the same way the design's own unbuilt tabs say
 * "send me the screen for this section."
 */
export function VenueCard({
  showId,
  venueId,
  locations,
  venues,
}: {
  showId: string;
  venueId: string | null;
  locations: RingRow[];
  venues: VenueOption[];
}) {
  const [rings, setRings] = useState<RingRow[]>(
    locations.length ? locations : [{ name: 'Ring 1', size: 'standard' }]
  );
  const [selectedVenue, setSelectedVenue] = useState(venueId ?? '');

  const { mutate: saveLocations } = useUpdateShowLocations();
  const { mutate: applyVenue, isPending: applyingVenue } = useApplySavedVenue({
    onSuccess: () => {
      toast.success('Venue applied — its ring layout is now this show’s.');
    },
  });

  function commit(next: RingRow[]) {
    setRings(next);
    saveLocations({ showId, locations: next });
  }

  function setCount(raw: string) {
    const count = Math.max(0, Math.min(MAX_RINGS, Number(raw) || 0));
    const next = Array.from({ length: count }, (_, i) => rings[i] ?? { name: `Ring ${String(i + 1)}`, size: 'standard' as const });
    commit(next);
  }

  function rename(index: number, name: string) {
    const next = rings.map((r, i) => (i === index ? { ...r, name } : r));
    commit(next);
  }

  function resize(index: number, size: 'standard' | 'small') {
    const next = rings.map((r, i) => (i === index ? { ...r, size } : r));
    commit(next);
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Venue</h2>
      <p className={SM_NOTE}>
        Pick a saved venue to bring in its ring layout — build or edit venues under Venues in the
        left nav. The rings/arenas below are that venue&rsquo;s layout; adjust the count or names if
        this show needs something different.
      </p>

      {venues.length > 0 ? (
        <div className="mb-5 max-w-[360px]">
          <label htmlFor="sm-venue" className={SM_LABEL}>
            Venue
          </label>
          <select
            id="sm-venue"
            value={selectedVenue}
            disabled={applyingVenue}
            className={SM_SELECT}
            onChange={(e) => {
              setSelectedVenue(e.target.value);
              if (!e.target.value) return;
              const venue = venues.find((v) => v.id === e.target.value);
              applyVenue({ showId, venueId: e.target.value });
              if (venue) setRings(venue.rings.length ? venue.rings : [{ name: 'Ring 1', size: 'standard' }]);
            }}
          >
            <option value="">— choose a saved venue —</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.rings.length} ring{v.rings.length === 1 ? '' : 's'})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mb-5 text-[13px] text-status-danger">
          No saved venues yet — build one under Venues in the left nav, or just set rings up below
          for this show only.
        </p>
      )}

      <div className="mb-[18px] max-w-[160px]">
        <label htmlFor="sm-ring-count" className={SM_LABEL}>
          Number of rings/arenas
        </label>
        <input
          id="sm-ring-count"
          type="number"
          min={0}
          max={MAX_RINGS}
          value={rings.length}
          className={SM_INPUT}
          onChange={(e) => {
            setCount(e.target.value);
          }}
        />
      </div>

      <div className="mb-4 flex flex-col gap-2.5">
        {rings.map((ring, i) => (
          <div
            key={i}
            className="grid grid-cols-[30px_minmax(0,1fr)_190px_auto] items-center gap-3"
          >
            <span className="text-[13.5px] font-bold text-forest">{i + 1}</span>
            <input
              value={ring.name}
              className={SM_ROW_INPUT}
              onChange={(e) => {
                rename(i, e.target.value);
              }}
            />
            <select
              value={ring.size}
              className={SM_ROW_INPUT + ' appearance-none'}
              onChange={(e) => {
                resize(i, e.target.value as 'standard' | 'small');
              }}
            >
              {RING_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="whitespace-nowrap rounded-[9px] border border-[#EDF0EE] bg-[#EFEAE0] px-[15px] py-2.5 text-[13px] font-semibold text-[#48574F] transition-colors hover:border-gold hover:text-ink-deep"
              onClick={() => {
                toast('Judge assignment isn’t built yet — coming in a later update.');
              }}
            >
              Assign Judges →
            </button>
          </div>
        ))}
      </div>

      <div className="mt-[26px] border-t border-[#EDF0EE] pt-[22px]">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
          Stables
        </div>
        <p className={SM_NOTE}>
          Barns and stalls for this show — assign horses/riders, print stable signage, and pick up a
          saved venue&rsquo;s stable layout instead of building one from scratch.
        </p>
        <PrimaryButton
          className="rounded-[9px]"
          onClick={() => {
            toast('The stable chart isn’t built yet — coming in a later update.');
          }}
        >
          <IconBarn size={15} />
          Open Stable Chart →
        </PrimaryButton>
      </div>
    </Card>
  );
}
