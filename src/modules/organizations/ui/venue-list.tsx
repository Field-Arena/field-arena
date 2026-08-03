'use client';

import { MapPin, CheckCircle2 } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { GhostButton, PrimaryButton, DangerButton } from '@/shared/ui/organizer/buttons';
import { IconBarn } from '@/shared/ui/organizer/icons';
import { VENUE_STAT_TINTS } from '../constants';
import { VenueFormDialog } from './venue-form-dialog';
import { useDeleteVenue } from '../hooks/use-venue-mutations';
import type { VenueListItem } from '../types';

/**
 * "Your venues" — the org's reusable venue library, ported from
 * showstaff.html's `locationsListHtml` (~line 5251): name, address, ring
 * count, stable count, Edit/Delete per row, "+ Add new venue".
 *
 * Adds an "in use" count (how many of this org's shows point at this venue)
 * that legacy's own list didn't show, and — unlike legacy's bare
 * `confirm('Delete this location?…')` — names what's attached in the
 * confirmation when a venue is in use, so deleting one three live shows
 * depend on is a decision the organizer can't make by accident. Deleting
 * still isn't blocked: those shows keep the ring layout they already copied
 * (see deleteVenue's doc comment), exactly like legacy always allowed.
 */
export function VenueList({ venues }: { venues: VenueListItem[] }) {
  const deleteVenue = useDeleteVenue();

  const inUseCount = venues.filter((v) => v.showCount > 0).length;
  const withRingsCount = venues.filter((v) => v.rings.length > 0).length;

  function handleDelete(venue: VenueListItem) {
    const message =
      venue.showCount > 0
        ? `Delete "${venue.name}"? ${String(venue.showCount)} show${venue.showCount === 1 ? '' : 's'} at this venue currently use${venue.showCount === 1 ? 's' : ''} its saved ring layout — deleting it won't change what those shows already copied, they'll just lose the link back to this venue.`
        : `Delete "${venue.name}"? This can't be undone.`;
    if (window.confirm(message)) {
      deleteVenue.mutate(venue.id);
    }
  }

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Venues</ScreenTitle>
          <ScreenLede className="mb-0">
            Reusable locations, built once and picked up by any show.
          </ScreenLede>
        </div>
        <VenueFormDialog
          trigger={
            <PrimaryButton>
              <span aria-hidden>+</span> Add new venue
            </PrimaryButton>
          }
        />
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <StatCard
          icon={<MapPin className="size-[18px]" aria-hidden />}
          value={String(venues.length)}
          label="Venues"
          tintBg={VENUE_STAT_TINTS[0].bg}
          tintFg={VENUE_STAT_TINTS[0].fg}
        />
        <StatCard
          icon={<CheckCircle2 className="size-[18px]" aria-hidden />}
          value={String(inUseCount)}
          label="In use"
          note="attached to a show"
          tintBg={VENUE_STAT_TINTS[1].bg}
          tintFg={VENUE_STAT_TINTS[1].fg}
        />
        <StatCard
          icon={<IconBarn size={18} />}
          value={String(withRingsCount)}
          label="With ring layout"
          tintBg={VENUE_STAT_TINTS[2].bg}
          tintFg={VENUE_STAT_TINTS[2].fg}
        />
      </div>

      <Card className="p-[18px_20px_20px]">
        <p className="mb-4 text-[13px] text-[#5A6B63]">
          Build a venue once &mdash; name, address, contact info, and how many rings/arenas it has
          &mdash; then pick it up on any show in Setup&rsquo;s Competition Locations card instead of
          rebuilding it every time.
        </p>

        {venues.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] italic text-[#7A8781]">
            No saved venues yet &mdash; click &ldquo;+ Add new venue&rdquo; to build your first one.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#EDF0EE] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold text-forest">{venue.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-[#6E7C76]">
                    {venue.address ?? 'No address on file'} · {venue.rings.length} ring
                    {venue.rings.length === 1 ? '' : 's'} · {venue.stables.length} stable
                    {venue.stables.length === 1 ? '' : 's'}
                    {venue.showCount > 0 &&
                      ` · ${String(venue.showCount)} show${venue.showCount === 1 ? '' : 's'}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <VenueFormDialog venue={venue} trigger={<GhostButton>Edit</GhostButton>} />
                  <DangerButton
                    disabled={deleteVenue.isPending}
                    onClick={() => {
                      handleDelete(venue);
                    }}
                  >
                    Delete
                  </DangerButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
