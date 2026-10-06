'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RING_SIZES, MAX_RINGS } from '@/modules/shows/schemas';
import type { ClassRow, RingRow, StaffRow, VenueOption } from '@/modules/shows/types';
import {
  useUpdateShowLocations,
  useApplySavedVenue,
} from '@/modules/shows/hooks/use-show-mutations';
import { AssignJudgesDialog } from '@/modules/judging/public';
import { Card } from '@/shared/ui/organizer/card';
import { primaryButtonClass } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { blockNonIntegerKeys } from '@/shared/lib/format/number-input';
import { IconBarn } from '@/shared/ui/organizer/icons';
import {
  SM_CARD_PAD,
  SM_NOTE,
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
  SM_ROW_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import { SmHead } from './sm-head';

export function VenueCard({
  showId,
  publicId,
  venueId,
  locations,
  venues,
  staff,
  classes,
}: {
  showId: string;
  publicId?: string;
  venueId: string | null;
  locations: RingRow[];
  venues: VenueOption[];
  staff: StaffRow[];
  classes: ClassRow[];
}) {
  const [rings, setRings] = useState<RingRow[]>(
    locations.length ? locations : [{ name: 'Ring 1', size: 'standard' }],
  );
  // Last ring list the server accepted — a failed save rolls back to it.
  const savedRings = useRef(rings);
  const [countDraft, setCountDraft] = useState<string | null>(null);
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
    const previous = savedRings.current;
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    savedRings.current = next;
    saveLocations(
      { showId, locations: next },
      {
        onError: () => {
          // Only roll back if no newer save has gone out since this one.
          if (savedRings.current !== next) return;
          savedRings.current = previous;
          setRings(previous);
        },
      },
    );
  }

  function setCount(raw: string) {
    setCountDraft(null);
    // A cleared field means "no change", not "zero rings".
    if (raw.trim() === '') return;
    const count = Math.max(0, Math.min(MAX_RINGS, Number(raw) || 0));
    const next = Array.from(
      { length: count },
      (_, i) => rings[i] ?? { name: `Ring ${String(i + 1)}`, size: 'standard' as const },
    );
    commit(next);
  }

  function editName(index: number, name: string) {
    setRings(rings.map((r, i) => (i === index ? { ...r, name } : r)));
  }

  function resize(index: number, size: 'standard' | 'small') {
    const next = rings.map((r, i) => (i === index ? { ...r, size } : r));
    commit(next);
  }

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <SmHead icon="venue" title="Venue" sub="Where the show runs and how many arenas it uses" />
        <p className={SM_NOTE}>
          Pick a saved venue to bring in its ring layout — build or edit venues under Venues in the
          left nav. The rings/arenas below are that venue&rsquo;s layout; adjust the count or names
          if this show needs something different.
        </p>

        {venues.length > 0 ? (
          <div className="mb-5 max-w-[360px]">
            <Label htmlFor="sm-venue" className={SM_LABEL}>
              Venue
            </Label>
            <select
              id="sm-venue"
              value={selectedVenue}
              disabled={applyingVenue}
              className={SM_SELECT}
              onChange={(e) => {
                setSelectedVenue(e.target.value);
                if (!e.target.value) return;
                const venue = venues.find((v) => v.id === e.target.value);
                const previousVenue = selectedVenue;
                const previousRings = savedRings.current;
                applyVenue(
                  { showId, venueId: e.target.value },
                  {
                    onError: () => {
                      setSelectedVenue(previousVenue);
                      savedRings.current = previousRings;
                      setRings(previousRings);
                    },
                  },
                );
                if (venue) {
                  const next: RingRow[] = venue.rings.length
                    ? venue.rings
                    : [{ name: 'Ring 1', size: 'standard' }];
                  savedRings.current = next;
                  setRings(next);
                }
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
          <Label htmlFor="sm-ring-count" className={SM_LABEL}>
            Number of rings/arenas
          </Label>
          <Input
            id="sm-ring-count"
            type="number"
            min={0}
            max={MAX_RINGS}
            step={1}
            value={countDraft ?? rings.length}
            className={`h-auto ${SM_INPUT}`}
            onChange={(e) => {
              setCountDraft(e.target.value);
            }}
            onBlur={(e) => {
              setCount(e.target.value);
            }}
            onKeyDown={(e) => {
              blockNonIntegerKeys(e);
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </div>

        <div className="mb-4 flex flex-col gap-2.5">
          {rings.map((ring, i) => (
            <div
              key={i}
              className="grid grid-cols-[30px_minmax(0,1fr)_190px_auto] items-center gap-3"
            >
              <span className="text-[13.5px] font-bold text-[#101828]">{i + 1}</span>
              <Input
                value={ring.name}
                maxLength={80}
                className={`h-auto ${SM_ROW_INPUT}`}
                onChange={(e) => {
                  editName(i, e.target.value);
                }}
                onBlur={() => {
                  commit(rings);
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
                className="h-auto rounded-[9px] border border-[#EEF1F4] bg-[#F5F7F8] px-[15px] py-2.5 text-[13px] font-semibold whitespace-nowrap text-[#475467] transition-colors hover:border-[#D6DBE1] hover:bg-[#F5F7F8] hover:text-[#101828]"
                onClick={() => {
                  setAssignRing(ring.name);
                }}
              >
                Assign Judges →
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-[26px] border-t border-[#EEF1F4] pt-[22px]">
          <div className="mb-2 text-[10px] font-bold tracking-[.08em] text-[#8A94A3] uppercase">
            Stables
          </div>
          <p className={SM_NOTE}>
            Barns and stalls for this show — assign horses/riders, print stable signage, and pick up
            a saved venue&rsquo;s stable layout instead of building one from scratch.
          </p>
          <Link
            href={`/dashboard/horses/stable-chart?show=${publicId ?? showId}`}
            prefetch={false}
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
