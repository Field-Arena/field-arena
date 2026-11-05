'use client';

import { useCallback, useState } from 'react';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useDismiss } from '@/shared/hooks/use-dismiss';
import { fmtTime, type ScheduleRide } from '@/modules/shows/schedule-engine';
import { useReorderRide, useScratchEntry } from '@/modules/shows/hooks/use-schedule-mutations';
import { rideTestCode } from '@/modules/shows/utils/schedule-level';

const DIV_CLASS: Record<string, string> = {
  AA: 'fa-r-div-aa',
  JR: 'fa-r-div-jr',
  J: 'fa-r-div-jr',
};

/** One ride on the Master Schedule grid — the prototype's .ride card. Click
 * opens the ride menu (move earlier/later, scratch); drag reorders within
 * the class. */
export function RideCard({
  showId,
  ride,
  index,
  count,
  color,
  score,
  isCurrent,
  dim,
  dragging,
  onDragStart,
  onDragEnd,
  onDropHere,
}: {
  showId: string;
  ride: ScheduleRide;
  index: number;
  count: number;
  color: string;
  score: string | undefined;
  isCurrent: boolean;
  dim: boolean;
  dragging: string | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropHere: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmScratch, setConfirmScratch] = useState(false);
  const close = useCallback(() => {
    setMenuOpen(false);
  }, []);
  const ref = useDismiss<HTMLDivElement>(menuOpen, close);
  const reorder = useReorderRide();
  const scratch = useScratchEntry();

  const scratched = ride.status === 'scratched';
  const movable = !scratched && !score;
  const division = ride.division.toUpperCase();
  const move = (toIndex: number) => {
    setMenuOpen(false);
    reorder.mutate({ showId, classId: ride.cls, entryId: ride.entryId, toIndex });
  };

  return (
    <div ref={ref} className="relative">
      <div
        role="button"
        tabIndex={0}
        draggable={movable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          if (dragging && dragging !== ride.entryId) e.preventDefault();
        }}
        onDrop={onDropHere}
        onClick={() => {
          setMenuOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMenuOpen((v) => !v);
          }
        }}
        className={[
          'fa-ride',
          menuOpen && 'fa-sel',
          dim && 'fa-dim',
          dragging === ride.entryId && 'fa-dragging',
          scratched && 'opacity-50',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          borderLeftColor: color,
          ...(isCurrent ? { background: 'var(--fa-amber-tint)' } : {}),
        }}
      >
        {movable && (
          <span className="fa-r-grip" aria-hidden>
            <svg viewBox="0 0 12 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.3" />
              <circle cx="9" cy="3" r="1.3" />
              <circle cx="3" cy="8" r="1.3" />
              <circle cx="9" cy="8" r="1.3" />
              <circle cx="3" cy="13" r="1.3" />
              <circle cx="9" cy="13" r="1.3" />
            </svg>
          </span>
        )}
        <span className="fa-r-time">{fmtTime(ride.start)}</span>
        <span className="fa-r-no">{index + 1}</span>
        <span className="fa-r-body">
          <div className={`fa-r-rider ${scratched ? 'line-through' : ''}`}>{ride.name}</div>
          <div className="fa-r-horse">
            {isCurrent ? '▸ Riding now · ' : ''}
            {ride.num ? `#${ride.num} · ` : ''}
            {ride.horse}
            {score ? ` · ${score}` : ''}
          </div>
        </span>
        <span className="fa-r-right">
          {division && (
            <span className={`fa-r-div ${DIV_CLASS[division] ?? 'fa-r-div-o'}`}>{division}</span>
          )}
          <span className="fa-r-test">{rideTestCode(ride.label)}</span>
          <span
            className={`fa-r-cert ${ride.qualifying ? 'fa-on' : ''}`}
            title={
              ride.qualifying
                ? `Qualifying${ride.quals.length ? ` — ${ride.quals.join(', ')}` : ''}`
                : undefined
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill={ride.qualifying ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden
            >
              <path
                strokeLinejoin="round"
                d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"
              />
            </svg>
          </span>
        </span>
      </div>

      {menuOpen && (
        <div className="fa-ride-pop fa-open !absolute top-[calc(100%+4px)] right-0">
          <div className="fa-rp-title">
            {ride.name}
            <span>
              {fmtTime(ride.start)} · {ride.horse}
            </span>
          </div>
          <button
            type="button"
            className="fa-rp-item"
            disabled={!movable || index === 0 || reorder.isPending}
            onClick={() => {
              move(index - 1);
            }}
          >
            ↑ Move earlier
          </button>
          <button
            type="button"
            className="fa-rp-item"
            disabled={!movable || index >= count - 1 || reorder.isPending}
            onClick={() => {
              move(index + 1);
            }}
          >
            ↓ Move later
          </button>
          <button
            type="button"
            className="fa-rp-item fa-danger"
            disabled={!movable || scratch.isPending}
            onClick={() => {
              setMenuOpen(false);
              setConfirmScratch(true);
            }}
          >
            ✕ Scratch ride
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmScratch}
        onOpenChange={setConfirmScratch}
        title={`Scratch #${ride.num}?`}
        description="They'll stay on the schedule, marked as scratched, so the printed sheet still accounts for them."
        confirmLabel={scratch.isPending ? 'Scratching…' : 'Scratch rider'}
        destructive
        pending={scratch.isPending}
        onConfirm={() => {
          scratch.mutate(
            { showId, entryId: ride.entryId },
            {
              onSuccess: () => {
                setConfirmScratch(false);
              },
            },
          );
        }}
      />
    </div>
  );
}
