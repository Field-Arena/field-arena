'use client';

import { useState } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatCard } from '@/shared/ui/organizer/stat-card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import { IconBarn } from '@/shared/ui/organizer/icons';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { VENUE_STAT_TINTS } from '@/modules/organizations/constants';
import { VenueFormDialog } from '@/modules/organizations/ui/venue-form-dialog';
import { useDeleteVenue } from '@/modules/organizations/hooks/use-venue-mutations';
import type { VenueListItem } from '@/modules/organizations/types';

export function VenueList({ venues }: { venues: VenueListItem[] }) {
  const deleteVenue = useDeleteVenue();

  const inUseCount = venues.filter((v) => v.showCount > 0).length;
  const withRingsCount = venues.filter((v) => v.rings.length > 0).length;

  const [pendingDelete, setPendingDelete] = useState<VenueListItem | null>(null);

  function handleDelete(venue: VenueListItem) {
    setPendingDelete(venue);
  }

  return (
    <div className="font-[family-name:var(--font-ar)] text-[#101828]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Venues</ScreenTitle>
          <ScreenLede className="mb-0">
            Build a venue once — name, address, contact info, and ring layout — then pick it up on
            any show instead of rebuilding it.
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

      <Card className="overflow-hidden p-0">
        <div className="fa-card-head">
          <div>
            <h3>Your venues</h3>
            <div className="fa-sub">
              Reusable across every show — name, contact, rings, and stables
            </div>
          </div>
        </div>

        {venues.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-[#8A94A3]">
            No saved venues yet &mdash; click &ldquo;+ Add new venue&rdquo; to build your first one.
          </p>
        ) : (
          <div>
            {venues.map((venue) => (
              <div key={venue.id} className="fa-venue-row flex-wrap">
                <div className="min-w-0">
                  <div className="fa-vr-name truncate">{venue.name}</div>
                  <div className="fa-vr-sub">
                    {venue.address ?? 'No address on file'} · {venue.rings.length} ring
                    {venue.rings.length === 1 ? '' : 's'} · {venue.stables.length} stable
                    {venue.stables.length === 1 ? '' : 's'}
                    {venue.showCount > 0 &&
                      ` · ${String(venue.showCount)} show${venue.showCount === 1 ? '' : 's'}`}
                  </div>
                </div>
                <div className="fa-row-actions flex-shrink-0">
                  <VenueFormDialog
                    venue={venue}
                    trigger={
                      <button type="button" className="fa-btn fa-btn-ghost fa-btn-sm">
                        Edit
                      </button>
                    }
                  />
                  <button
                    type="button"
                    className="fa-act fa-danger"
                    disabled={deleteVenue.isPending}
                    onClick={() => {
                      handleDelete(venue);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : 'Delete venue?'}
        description={
          pendingDelete && pendingDelete.showCount > 0
            ? `${String(pendingDelete.showCount)} show${pendingDelete.showCount === 1 ? '' : 's'} at this venue currently use${pendingDelete.showCount === 1 ? 's' : ''} its saved ring layout. Deleting it won't change what those shows already copied — they'll just lose the link back to this venue.`
            : "This can't be undone."
        }
        confirmLabel={deleteVenue.isPending ? 'Deleting…' : 'Delete venue'}
        destructive
        pending={deleteVenue.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteVenue.mutate(pendingDelete.id, {
            onSuccess: () => {
              setPendingDelete(null);
            },
          });
        }}
      />
    </div>
  );
}
