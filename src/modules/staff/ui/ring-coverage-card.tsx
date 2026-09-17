'use client';

import { Card } from '@/shared/ui/organizer/card';
import { useAssignRingAnnouncer } from '../hooks/use-user-directory-mutations';
import type { RingCoverageData } from '../types';

interface Announcer {
  id: string;
  name: string;
  isSteward: boolean;
}

const SELECT_CLASS =
  'min-w-[220px] rounded-[10px] border border-[#D9E1DD] bg-white px-3 py-2 text-[13.5px] text-ink-deep outline-none focus-visible:border-gold';

function announcerLabel(a: Announcer): string {
  return a.isSteward ? `${a.name} (also steward)` : a.name;
}

export function RingCoverageCard({
  showId,
  coverage,
  announcers,
}: {
  showId: string;
  coverage: RingCoverageData;
  announcers: Announcer[];
}) {
  const assignRing = useAssignRingAnnouncer();
  const announcerById = new Map(announcers.map((a) => [a.id, a]));

  const coverageByAnnouncer = new Map<string, string[]>();
  const unassignedRings: string[] = [];
  for (const ring of coverage.rings) {
    const staffId = coverage.assignments[ring];
    if (staffId && announcerById.has(staffId)) {
      const list = coverageByAnnouncer.get(staffId) ?? [];
      list.push(ring);
      coverageByAnnouncer.set(staffId, list);
    } else {
      unassignedRings.push(ring);
    }
  }
  const idleAnnouncers = announcers.filter((a) => !coverageByAnnouncer.has(a.id));

  return (
    <Card className="mt-4 p-[18px_20px_20px]">
      <h2 className="text-forest mb-1 font-[Newsreader,serif] text-[20px] font-semibold">
        Announcer — Ring Coverage
      </h2>
      <p className="mb-4 text-[13px] text-[#5A6B63]">
        Assign who covers each ring. One person can cover several rings, or each ring can have its
        own — set it however this show actually runs.
      </p>

      {announcers.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781] italic">
          No Announcers added to this show&apos;s staff yet — add one above with that role, then
          come back here to assign rings.
        </p>
      ) : coverage.rings.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781] italic">
          This show has no classes with a ring/arena set yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[12px] border border-[#EDF0EE]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#EEF2F0] bg-[#F8FAF9]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase">
                    Ring
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase">
                    Announcer
                  </th>
                </tr>
              </thead>
              <tbody>
                {coverage.rings.map((ring) => (
                  <tr key={ring} className="border-b border-[#F1F4F3] last:border-b-0">
                    <td className="text-ink-deep px-4 py-2.5 font-semibold">{ring}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={coverage.assignments[ring] ?? ''}
                        disabled={assignRing.isPending}
                        onChange={(e) => {
                          assignRing.mutate({
                            showId,
                            ringName: ring,
                            staffAssignmentId: e.target.value || null,
                          });
                        }}
                        className={SELECT_CLASS}
                        aria-label={`Announcer for ${ring}`}
                      >
                        <option value="">Unassigned</option>
                        {announcers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {announcerLabel(a)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 rounded-[10px] bg-[#F1F4F1] px-4 py-3 text-[13px] leading-[1.7]">
            {[...coverageByAnnouncer.entries()].map(([staffId, rings]) => {
              const a = announcerById.get(staffId);
              return (
                <div key={staffId}>
                  <strong className="text-ink-deep">{a ? announcerLabel(a) : staffId}</strong> —
                  covering {rings.length} ring{rings.length === 1 ? '' : 's'}: {rings.join(', ')}
                </div>
              );
            })}
            {unassignedRings.length > 0 && (
              <div className="text-status-danger font-semibold">
                Not yet covered: {unassignedRings.join(', ')}
              </div>
            )}
            {idleAnnouncers.length > 0 && (
              <div className="text-[#7A8781]">
                Not yet assigned to a ring: {idleAnnouncers.map(announcerLabel).join(', ')}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
