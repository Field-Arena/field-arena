'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { VenueFormDialog } from '@/modules/organizations/ui/venue-form-dialog';
import { useDeleteVenue } from '@/modules/organizations/hooks/use-venue-mutations';
import type { VenueListItem } from '@/modules/organizations/types';

const PRIMARY =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-4 py-2 text-[14px] font-bold text-white';
const SMALL =
  'cursor-pointer rounded-[8px] border-[1.5px] border-[#1A5B3C] bg-white px-3 py-1 text-[12.5px] font-bold text-[#1A5B3C] disabled:opacity-60';

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[12px] border-[1.5px] border-[#D9E1DD] bg-white px-4 py-3">
      <p className="text-[12.5px] font-semibold text-[#5A6B63]">{label}</p>
      <p className="mt-0.5 text-[26px] font-bold" style={{ color: color ?? '#0D2C23' }}>
        {value}
      </p>
    </div>
  );
}

function MiniBox({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-[12px] border-[1.5px] border-[#D9E1DD] px-3 py-2">
      <p className="text-[12px] font-semibold text-[#5A6B63]">{label}</p>
      <p className="text-[20px] leading-tight font-bold text-[#0D2C23]">{value}</p>
      <p className="text-[12px] font-semibold text-[#5A6B63]">{note}</p>
    </div>
  );
}

export function VenueList({ venues }: { venues: VenueListItem[] }) {
  const deleteVenue = useDeleteVenue();

  const inUseCount = venues.filter((v) => v.showCount > 0).length;
  const withRingsCount = venues.filter((v) => v.rings.length > 0).length;

  const [pendingDelete, setPendingDelete] = useState<VenueListItem | null>(null);

  function handleDelete(venue: VenueListItem) {
    setPendingDelete(venue);
  }

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-semibold text-[#5A6B63]">
            Saved venues with their rings and stables &mdash; reuse them for every show
          </p>
          <h1 className="mt-1 font-[family-name:var(--ws-fraunces)] text-[32px] leading-[1.1] font-bold text-[#0D2C23]">
            Venues
          </h1>
        </div>
        <VenueFormDialog
          trigger={
            <button type="button" className={PRIMARY}>
              <span aria-hidden>+</span> Add venue
            </button>
          }
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBox label="Venues" value={venues.length} />
        <StatBox label="In use by a show" value={inUseCount} color="#1A5B3C" />
        <StatBox label="With ring layout" value={withRingsCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => {
          const stalls = venue.stables.reduce((sum, st) => sum + st.stalls.length, 0);
          const sizes = [
            ...new Set(venue.rings.map((r) => (r.size === 'small' ? 'Small' : 'Standard'))),
          ];
          return (
            <div
              key={venue.id}
              className={`rounded-[16px] border-[1.5px] bg-white p-[16px_18px] ${
                venue.showCount > 0 ? 'border-[#1A5B3C]' : 'border-[#C9D3CE]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 font-[family-name:var(--ws-fraunces)] text-[20px] leading-[1.2] font-bold text-[#0D2C23]">
                  {venue.name}
                </h2>
                <span
                  className={`flex-none rounded-[7px] px-2.5 py-1 text-[11.5px] font-extrabold ${
                    venue.showCount > 0
                      ? 'bg-[#E9F4EE] text-[#1A5B3C]'
                      : 'bg-[#EDF0EE] text-[#5A6B63]'
                  }`}
                >
                  {venue.showCount > 0
                    ? `${String(venue.showCount)} show${venue.showCount === 1 ? '' : 's'}`
                    : 'Not used yet'}
                </span>
              </div>
              <p className="mt-1 mb-3 text-[13px] font-semibold text-[#5A6B63]">
                {venue.address ?? 'No address on file'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <MiniBox
                  label="Rings"
                  value={venue.rings.length}
                  note={venue.rings.length > 0 ? sizes.join(' · ') : 'none set up'}
                />
                <MiniBox
                  label="Stables"
                  value={venue.stables.length}
                  note={venue.stables.length > 0 ? `${String(stalls)} stalls` : 'none set up'}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <VenueFormDialog
                  venue={venue}
                  trigger={
                    <button type="button" className={SMALL}>
                      Edit
                    </button>
                  }
                />
                <button
                  type="button"
                  disabled={deleteVenue.isPending}
                  onClick={() => {
                    handleDelete(venue);
                  }}
                  className={`${SMALL} border-[#98341F] text-[#98341F]`}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        <VenueFormDialog
          trigger={
            <button
              type="button"
              className="flex min-h-[180px] cursor-pointer items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-[#C9D3CE] bg-white text-[15px] font-bold text-[#5A6B63] hover:border-[#1A5B3C] hover:text-[#1A5B3C]"
            >
              + Add a venue
            </button>
          }
        />
      </div>
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
