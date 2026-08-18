'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RING_SIZES, MAX_RINGS } from '@/modules/shows/schemas';
import type { RingRow, VenueOption, ClassRow, StaffRow } from '@/modules/shows/data/setup-queries';
import {
  useUpdateShowLocations,
  useApplySavedVenue,
} from '@/modules/shows/hooks/use-show-mutations';
import { AssignJudgesDialog } from '@/modules/judging/ui/assign-judges-dialog';
import { Card } from '@/shared/ui/organizer/card';
import { primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { IconBarn } from '@/shared/ui/organizer/icons';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
  SM_ROW_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';

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
 * "Assign Judges" (per ring) opens AssignJudgesDialog — pick the head judge and
 * scribe and the classes they officiate; it writes the class panel that a
 * Judge/Scribe's My Assignments reads. "Open Stable Chart" links to the real
 * stable chart (modules/shows/ui/stable-chart/).
 */
export function VenueCard({
  showId,
  venueId,
  locations,
  venues,
  staff,
  classes,
}: {
  showId: string;
  venueId: string | null;
  locations: RingRow[];
  venues: VenueOption[];
  staff: StaffRow[];
  classes: ClassRow[];
}) {
  const [rings, setRings] = useState<RingRow[]>(
    locations.length ? locations : [{ name: 'Ring 1', size: 'standard' }],
  );
  const [selectedVenue, setSelectedVenue] = useState(venueId ?? '');
  const [assignRing, setAssignRing] = useState<string | null>(null);

  const judges = staff
    .filter((s) => s.role.toLowerCase() === 'judge')
    .map((s) => ({ id: s.id, name: s.name }));
  const scribes = staff
    .filter((s) => s.role.toLowerCase() === 'scribe')
    .map((s) => ({ id: s.id, name: s.name }));
  const panelClasses = classes.map((c) => ({
    id: c.id,
    label: c.displayName ?? c.label,
    location: c.location,
  }));

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
    const next = Array.from(
      { length: count },
      (_, i) => rings[i] ?? { name: `Ring ${String(i + 1)}`, size: 'standard' as const },
    );
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
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Venue</h2>
        <p className={SM_NOTE}>
          Pick a saved venue to bring in its ring layout — build or edit venues under Venues in the
          left nav. The rings/arenas below are that venue&rsquo;s layout; adjust the count or names
          if this show needs something different.
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
                if (venue)
                  setRings(
                    venue.rings.length ? venue.rings : [{ name: 'Ring 1', size: 'standard' }],
                  );
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
          <p className="text-status-danger mb-5 text-[13px]">
            No saved venues yet — build one under Venues in the left nav, or just set rings up below
            for this show only.
          </p>
        )}

        <div className="mb-[18px] max-w-[160px]">
          <label htmlFor="sm-ring-count" className={SM_LABEL}>
            Number of rings/arenas
          </label>
          <Input
            id="sm-ring-count"
            type="number"
            min={0}
            max={MAX_RINGS}
            value={rings.length}
            className={`h-auto ${SM_INPUT}`}
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
              <span className="text-forest text-[13.5px] font-bold">{i + 1}</span>
              <Input
                value={ring.name}
                className={`h-auto ${SM_ROW_INPUT}`}
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
              <Button
                type="button"
                variant="ghost"
                className="hover:border-gold hover:text-ink-deep h-auto rounded-[9px] border border-[#EDF0EE] bg-[#EFEAE0] px-[15px] py-2.5 text-[13px] font-semibold whitespace-nowrap text-[#48574F] transition-colors hover:bg-[#EFEAE0]"
                onClick={() => {
                  setAssignRing(ring.name);
                }}
              >
                Assign Judges →
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-[26px] border-t border-[#EDF0EE] pt-[22px]">
          <div className="mb-2 text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
            Stables
          </div>
          <p className={SM_NOTE}>
            Barns and stalls for this show — assign horses/riders, print stable signage, and pick up
            a saved venue&rsquo;s stable layout instead of building one from scratch.
          </p>
          <Link
            href={`/dashboard/horses/stable-chart?show=${showId}`}
            className={primaryButtonClass + ' rounded-[9px]'}
          >
            <IconBarn size={15} />
            Open Stable Chart →
          </Link>
        </div>
      </Card>

      <AssignJudgesDialog
        open={assignRing !== null}
        onOpenChange={(next) => {
          if (!next) setAssignRing(null);
        }}
        ringName={assignRing ?? ''}
        classes={panelClasses}
        judges={judges}
        scribes={scribes}
      />
    </>
  );
}
