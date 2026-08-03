'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { ribbonFor } from '../../constants';
import type { ShowAwards } from '../../data/setup-queries';

/**
 * Awards — standings and ribbon placings for a show.
 *
 * Placings are the judged result, not a projection: a class shows the places
 * decided so far and nothing more, so this is usable mid-show as well as after.
 *
 * The filters live in the URL rather than component state so a particular view
 * ("Division grouping, Dressage only") is linkable and survives the refresh
 * that follows any scoring change.
 */
export function AwardsScreen({
  awards,
  grouping,
  discipline,
}: {
  awards: ShowAwards;
  grouping: 'test' | 'division';
  discipline: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`?${next.toString()}`);
  }

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <ScreenTitle className="mb-1.5">Awards</ScreenTitle>
      <ScreenLede>Standings and ribbon placings, by class and discipline.</ScreenLede>

      <div className="mb-4 print:hidden">
        <Link href="/dashboard" className="inline-flex">
          <GhostButton>← Back to Dashboard</GhostButton>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4 print:hidden">
        <label className="flex flex-col gap-1.5">
          <span className="text-[9.5px] font-bold tracking-[.16em] text-[#7A8781] uppercase">
            Discipline
          </span>
          <select
            value={discipline}
            onChange={(e) => {
              setParam('discipline', e.target.value);
            }}
            className="rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-2.5 text-[13.5px]"
          >
            <option>All disciplines</option>
            {awards.disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[9.5px] font-bold tracking-[.16em] text-[#7A8781] uppercase">
            Awards grouping
          </span>
          <div className="inline-flex overflow-hidden rounded-[8px] border border-[#D9E1DD]">
            {(['test', 'division'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setParam('grouping', option);
                }}
                className={cn(
                  'px-3.5 py-2 text-[13px] font-semibold transition-colors',
                  grouping === option ? 'bg-forest text-white' : 'bg-white text-forest'
                )}
              >
                {option === 'test' ? 'By Test' : 'By Division'}
              </button>
            ))}
          </div>
        </div>

        <GhostButton
          className="ml-auto"
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-4" aria-hidden />
          Print ribbon list
        </GhostButton>
      </div>

      <Card className="mb-5 p-5">
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <span className="text-[9.5px] font-bold tracking-[.16em] text-[#7A8781] uppercase">
            Ribbons to bring
          </span>
          <b className="text-[22px]">{awards.ribbonTotal}</b>
          <span className="text-[12.5px] text-[#7A8781]">
            across all classes · grouped by {grouping === 'division' ? 'division' : 'test'}
          </span>
        </div>

        {awards.ribbonTotal === 0 ? (
          <p className="text-[13px] italic text-[#98A29D]">
            Nothing placed yet — ribbon counts appear as classes are scored.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {awards.ribbonCounts.map((count, index) => {
              if (!count) return null;
              const ribbon = ribbonFor(index);

              return (
                <span
                  key={ribbon.place}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E9EDEB] px-3 py-1.5 text-[12.5px]"
                >
                  <span
                    className="inline-block size-3 rounded-full border border-black/10"
                    style={{ background: ribbon.bg }}
                    aria-hidden
                  />
                  <b>{ribbon.place}</b>
                  {ribbon.name && <span className="text-[#7A8781]">{ribbon.name}</span>}
                  <span className="font-semibold">×{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </Card>

      {awards.groups.length === 0 ? (
        <Card className="p-6 text-center text-[13.5px] text-[#7A8781]">
          No classes match that filter.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {awards.groups.map((group) => (
            <Card key={group.name} className="p-5">
              <div className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-[#E9EDEB] pb-2">
                <h2 className="font-[family-name:var(--font-nr)] text-[17px] font-semibold text-forest">
                  {group.name}
                </h2>
                <span className="text-[12.5px] text-[#7A8781]">
                  {group.classes.length} {group.classes.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {group.classes.map((cls) => (
                  <div key={cls.name}>
                    <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
                      <span className="text-[13.5px] font-bold">{cls.name}</span>
                      <span className="text-[12px] text-[#7A8781]">
                        {cls.placings.length === 0
                          ? `not scored yet · ${String(cls.ribbonPlaces)} places`
                          : `${String(cls.placings.length)} placed of ${String(cls.ribbonPlaces)}`}
                      </span>
                    </div>

                    {cls.placings.length === 0 ? (
                      <p className="text-[12.5px] italic text-[#98A29D]">
                        No scores in yet for this class.
                      </p>
                    ) : (
                      <ol className="flex flex-col gap-0.5">
                        {cls.placings.map((placing) => {
                          const ribbon = ribbonFor(placing.place - 1);

                          return (
                            <li
                              key={placing.num}
                              className={cn(
                                'flex flex-wrap items-center gap-2.5 rounded-[6px] px-2 py-1 text-[12.5px]',
                                // The winner's row is tinted and bolder, as in
                                // the design — the first line is what an
                                // announcer reads out.
                                placing.place === 1 && 'bg-[#FBF8EF] font-bold'
                              )}
                            >
                              <span
                                className="inline-grid size-5 flex-none place-items-center rounded-full border border-black/10 text-[10px] font-bold"
                                style={{ background: ribbon.bg, color: ribbon.fg }}
                              >
                                {placing.place}
                              </span>
                              <span className="min-w-0 flex-1">{placing.rider}</span>
                              <span className="text-[#7A8781]">{placing.horse}</span>
                              <span className="w-[52px] text-right font-semibold">
                                {placing.pct}%
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
