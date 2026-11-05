import { CardTitle, EmptyState, FaCard, Pill } from '@/shared/ui/organizer/fa-page';
import type { RingRow } from '@/modules/announcements/types';

export function ActiveRingsPanel({ liveRings }: { liveRings: RingRow[] }) {
  if (liveRings.length === 0) {
    return (
      <EmptyState
        title="Nothing live right now"
        note="A class appears here once its scoring is opened from the scoring screen."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {liveRings.map((ring) => (
        <FaCard key={ring.classId} tone="live" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-[22px]">
              {ring.ring ?? 'Ring not set'} · {ring.className}
            </CardTitle>
            {ring.current ? (
              <Pill tone="green">
                Ride {ring.position + 1} of {ring.entryCount}
              </Pill>
            ) : (
              <Pill tone="green">Ring complete</Pill>
            )}
          </div>

          {ring.current ? (
            <div className="rounded-[12px] border-[1.5px] border-[#1A5B3C] px-3.5 py-3">
              <div className="text-[12.5px] font-semibold text-[#5A6B63]">Now in ring</div>
              <div className="text-[24px] leading-tight font-bold text-[#0D2C23]">
                #{ring.current.num} {ring.current.rider ?? '—'} · {ring.current.horse ?? '—'}
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border-[1.5px] border-dashed border-[#C9D3CE] px-3.5 py-3 text-[14px] font-semibold text-[#5A6B63]">
              Every ride in this class is done.
            </div>
          )}

          {ring.upNext.length > 0 && (
            <div>
              <div className="mb-1 text-[12.5px] font-semibold text-[#5A6B63]">
                Up next — rest of the running order
              </div>
              {/* Legacy listed every remaining rider as its own queue row
               * (announcer.html:478), not a truncated strip of chips. An
               * announcer reads ahead to prep names, sponsors and horse
               * details, so the whole order has to be visible. */}
              <ol className="m-0 flex list-none flex-col p-0">
                {ring.upNext.map((entry, i) => (
                  <li
                    key={entry.num}
                    className="flex items-baseline gap-2.5 border-t border-[#EDF0EE] py-1.5 first:border-t-0"
                  >
                    <span
                      className="w-6 flex-none text-right text-[12px] font-bold text-[#5A6B63]"
                      aria-hidden="true"
                    >
                      {ring.position + 2 + i}
                    </span>
                    <span className="text-[15px] font-bold text-[#0D2C23]">
                      #{entry.num} {entry.rider ?? '—'} · {entry.horse ?? '—'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </FaCard>
      ))}
    </div>
  );
}
