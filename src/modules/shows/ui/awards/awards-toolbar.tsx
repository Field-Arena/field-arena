'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PrinterIcon } from 'lucide-react';
import { Eyebrow } from '@/shared/ui/organizer/card';
import { PrimaryButton } from '@/shared/ui/organizer/buttons';
import type { ShowAwards } from '@/modules/shows/data/setup-queries';
import { GroupingToggle } from '@/modules/shows/ui/awards/grouping-toggle';

/** Show picker, discipline filter, By Test / By Division grouping, and print. */
export function AwardsToolbar({
  awards,
  shows,
  discipline,
}: {
  awards: ShowAwards;
  shows: { id: string; name: string }[];
  discipline: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // Both selections live in the URL so a particular view ("this show, FEI
  // only") is linkable and survives the refresh that follows any scoring
  // change.
  function setParam(key: string, value: string, clearWhen: string) {
    const next = new URLSearchParams(params.toString());
    if (value === clearWhen) next.delete(key);
    else next.set(key, value);
    router.replace(next.size > 0 ? `?${next.toString()}` : '?');
  }

  function setDiscipline(value: string) {
    setParam('discipline', value, 'all');
  }

  return (
    <>
      {/*
        The show picker the legacy awards toolbar carried. This screen is a
        full-page overlay rather than a WorkspacePage, so it does not inherit
        the workspace header's own switcher — without this an organizer who
        arrived from the dashboard could not reach another show's ribbons
        without going back.

        Switching show drops the discipline filter: levels are derived from
        class names, so the level picked on one show usually does not exist on
        the next, and keeping it would silently show an empty list.
      */}
      {shows.length > 1 && (
        <label className="flex min-w-[200px] flex-col gap-2">
          <Eyebrow>Show</Eyebrow>
          <select
            value={awards.showId}
            onChange={(e) => {
              router.replace(`?show=${e.target.value}`);
            }}
            className="rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-[9px] text-[13.5px]"
          >
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex min-w-[170px] flex-col gap-2">
        <Eyebrow>Discipline</Eyebrow>
        <select
          value={discipline}
          onChange={(e) => {
            setDiscipline(e.target.value);
          }}
          className="rounded-[8px] border border-[#D9E1DD] bg-white px-3 py-[9px] text-[13.5px]"
        >
          <option value="all">All disciplines</option>
          {awards.disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <Eyebrow>Awards grouping</Eyebrow>
        <GroupingToggle showId={awards.showId} byDivision={awards.awardsByDivision} />
      </div>

      <PrimaryButton
        className="ml-auto"
        onClick={() => {
          window.print();
        }}
      >
        <PrinterIcon className="size-[15px]" aria-hidden />
        Print ribbon list (PDF)
      </PrimaryButton>
    </>
  );
}
