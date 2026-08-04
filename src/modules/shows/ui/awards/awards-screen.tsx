'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card, Eyebrow } from '@/shared/ui/organizer/card';
import { GhostButton, PrimaryButton } from '@/shared/ui/organizer/buttons';
import { cn } from '@/shared/lib/utils';
import { RIBBONS, ribbonFor } from '../../constants';
import { useUpdateScheduleRules } from '../../hooks/use-schedule-mutations';
import type { ShowAwards } from '../../data/setup-queries';
import type { AwardLevel, AwardSection, AwardsReport } from '../../awards-engine';
import { PrintDate } from '@/shared/ui/print-date';

/**
 * Awards — the ribbon-gathering list for a show.
 *
 * Ported from the Admin Console design's Awards overlay (`Field & Arena Admin
 * Console.dc.html`, `awOpen` block, ~lines 314-396): a toolbar card (show
 * picker, discipline filter, By Test/By Division grouping, print), a "ribbons
 * to bring" summary card with a numbered chip per colour, then one card per
 * level, each holding a grid of classes with a numbered-badge placings list.
 *
 * This is a full-page overlay rather than a `WorkspacePage`, so it carries the
 * show picker itself — there is no workspace header above it to inherit one
 * from, and without it an organizer who arrived from the dashboard could not
 * reach another show's ribbons.
 *
 * Screen and print render the same components from different data: the sheet
 * covers the whole show even when the screen is filtered to one level. See
 * ShowAwards.printReport.
 *
 * Placings are the judged result and nothing more — a class part-way through
 * shows the places decided so far, so this is usable mid-show.
 */
export function AwardsScreen({
  awards,
  shows,
  discipline,
}: {
  awards: ShowAwards;
  /** Every show the organization owns, for the toolbar's own picker. */
  shows: { id: string; name: string }[];
  /** 'all', or one of the show's levels — mirrors the URL. */
  discipline: string;
}) {
  const { report } = awards;
  const groupedByLabel = awards.awardsByDivision ? 'Division' : 'Test';

  return (
    <div className="font-[family-name:var(--font-ar)] text-ink-deep">
      <div className="mb-4 print:hidden">
        <Link href="/dashboard" className="mb-[18px] inline-flex">
          <GhostButton>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to Dashboard
          </GhostButton>
        </Link>

        <ScreenTitle>Awards</ScreenTitle>
        <ScreenLede>Standings and ribbon placings, by class and discipline.</ScreenLede>
      </div>

      {!awards.hasClasses ? (
        <p className="text-[13.5px] text-[#7A8781]">No classes to show yet.</p>
      ) : (
        <>
          <Card className="mb-3.5 flex flex-wrap items-end gap-[22px] p-[16px_20px_18px] print:hidden">
            <AwardsToolbar awards={awards} shows={shows} discipline={discipline} />
          </Card>

          <AwardsReportBody
            report={report}
            ribbonTotal={awards.ribbonTotal}
            groupedByLabel={groupedByLabel}
          />

          {/*
            The printed sheet is its own document, built from the UNFILTERED
            report — see ShowAwards.printReport for why printAllAwards ignores
            the discipline filter.

            dashboard.css's @media print block hides everything except
            [data-print-report], so the screen copy above and the page chrome
            (toolbar, back button) drop away on their own; this subtree is
            display:none on screen so the two never both show.
          */}
          <div data-print-report className="hidden print:block">
            <div className="mb-4 flex items-start justify-between border-b border-black/20 pb-2">
              <div>
                <h1 className="font-[family-name:var(--font-nr)] text-[22px] font-semibold">
                  Awards — {awards.showName}
                </h1>
                <div className="text-[12px] text-[#555]">
                  {[awards.dates, awards.venue].filter(Boolean).join(' · ')}
                </div>
              </div>
              <PrintDate />
            </div>

            <AwardsReportBody
              report={awards.printReport}
              ribbonTotal={awards.printRibbonTotal}
              groupedByLabel={groupedByLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The report itself: the ribbons-to-bring summary, then one card per level.
 *
 * Shared by the screen and the printed sheet so the two can never drift into
 * different-looking documents — they differ only in which report they are
 * handed, filtered or whole.
 */
function AwardsReportBody({
  report,
  ribbonTotal,
  groupedByLabel,
}: {
  report: AwardsReport;
  ribbonTotal: number;
  groupedByLabel: string;
}) {
  return (
    <>
      <Card className="mb-[22px] grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 p-[16px_20px_18px] print:break-inside-avoid">
        <div className="flex flex-col gap-[5px] border-r border-[#EEF2F0] pr-6">
          <Eyebrow>Ribbons to bring</Eyebrow>
          <span className="text-[31px] leading-none font-bold tracking-[-.028em] text-[#16261F]">
            {ribbonTotal}
          </span>
          {/* "per class/pool" verbatim from the legacy summary row: ribbon
              count is a per-class setting in Select Events, so there is no one
              show-wide number this could be reporting instead. */}
          <span className="text-[12px] text-[#98A29D]">
            per class/pool, see below · grouped by {groupedByLabel}
          </span>
        </div>
        <RibbonChips maxPlaces={report.maxPlaces} tally={report.tally} />
      </Card>

      {report.levels.length === 0 ? (
        <p className="text-[13.5px] text-[#7A8781]">No scores entered yet.</p>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {report.levels.map((level) => (
            <LevelCard key={level.level} level={level} />
          ))}
        </div>
      )}
    </>
  );
}

/** One card per level — a header row, then a grid of classes. */
function LevelCard({ level }: { level: AwardLevel }) {
  return (
    <Card className="overflow-hidden print:break-inside-avoid">
      <div className="flex items-baseline gap-3 border-b border-[#E9EDEB] px-[18px] py-[13px]">
        <h2 className="font-[family-name:var(--font-nr)] text-[21px] font-semibold tracking-[-.012em] text-[#0D2C23]">
          {level.level}
        </h2>
        <span className="ml-auto text-[11.5px] font-bold tracking-[.12em] text-[#98A29D] uppercase">
          {level.classCount} class{level.classCount === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))]">
        {level.sections.map((section, i) => (
          <SectionBox key={`${section.title}-${String(i)}`} section={section} />
        ))}
      </div>
    </Card>
  );
}

/** One class (or pooled unit) within a level — name, placed count, numbered rows. */
function SectionBox({ section }: { section: AwardSection }) {
  return (
    <div className="-ml-px min-w-0 border-t border-l border-[#EEF2F0] px-5 py-4 pb-[18px] print:break-inside-avoid">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="text-[10px] font-bold tracking-[.14em] whitespace-nowrap text-forest uppercase">
          {section.title}
        </span>
        <span className="h-px flex-1 bg-[#EEF2F0]" />
        <span className="text-[11.5px] whitespace-nowrap text-[#98A29D]">
          {section.rows.length} placed
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {section.rows.map((row) => {
          const ribbon = ribbonFor(row.rank, section.colors);

          return (
            <div
              key={`${row.num}-${row.name}-${String(row.rank)}`}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-[9px] px-2 py-1.5"
            >
              <span
                className={cn(
                  'grid size-[22px] place-items-center rounded-full text-[11.5px] font-bold',
                  ribbon.bg === '#FFFFFF' ? 'border border-[#BCC6C1]' : ''
                )}
                style={{ background: ribbon.bg, color: ribbon.fg }}
              >
                {row.rank + 1}
              </span>
              <span
                className={cn(
                  'overflow-hidden text-[15px] text-ellipsis whitespace-nowrap text-[#16261F]',
                  row.rank === 0 ? 'font-bold' : 'font-semibold'
                )}
              >
                {row.name}
              </span>
              <span className="text-[13.5px] whitespace-nowrap text-[#7A8781]">{row.horse}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * How many of each colour to pull before the first class, as pill chips.
 *
 * Runs to the most places any one unit awards — a show where nothing awards
 * more than four places has no reason to list six. Six is the floor, matching
 * the legacy's `maxPlacesSeen || 6`, so the strip is never empty.
 *
 * Standard colours only, even where a class overrides them: this is the count
 * for the ribbon box, and a class's own championship ribbons are counted under
 * their own name by the tally.
 */
function RibbonChips({ maxPlaces, tally }: { maxPlaces: number; tally: Record<string, number> }) {
  const places = Array.from({ length: maxPlaces || 6 }, (_, i) => ribbonFor(i));

  // A class carrying custom colours contributes names the standard list has no
  // row for; they would otherwise be tallied and never shown.
  const standard = new Set(RIBBONS.map((r) => r.name));
  const custom = Object.keys(tally)
    .filter((name) => name && !standard.has(name as (typeof RIBBONS)[number]['name']))
    .sort();

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      {places.map((ribbon, index) => (
        <RibbonChip
          key={ribbon.place || index}
          place={ribbon.place}
          fill={ribbon.bg}
          numFg={ribbon.fg}
          name={ribbon.name || '—'}
          count={tally[ribbon.name] ?? 0}
        />
      ))}

      {custom.map((name) => (
        <RibbonChip key={name} place="" fill="#E7EEE9" numFg="#1F3A2E" name={name} count={tally[name] ?? 0} />
      ))}
    </div>
  );
}

function RibbonChip({
  place,
  fill,
  numFg,
  name,
  count,
}: {
  place: string;
  fill: string;
  numFg: string;
  name: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-[9px] rounded-full border border-[#E9EDEB] bg-white py-[5px] pr-[13px] pl-[5px]">
      <span
        className={cn(
          'grid size-6 place-items-center rounded-full text-[11.5px] font-bold',
          fill === '#FFFFFF' ? 'border border-[#BCC6C1]' : ''
        )}
        style={{ background: fill, color: numFg }}
      >
        {place}
      </span>
      <span className="text-[13px] font-semibold text-[#16261F]">{name}</span>
      <span className="text-[12.5px] text-[#98A29D]">×{count}</span>
    </span>
  );
}

/** Show picker, discipline filter, By Test / By Division grouping, and print. */
function AwardsToolbar({
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

/**
 * By Test / By Division.
 *
 * The same show-wide setting Master Schedule's rules card writes, not a filter
 * local to this page — an organizer who flips it here has changed how the show
 * awards, and the schedule agrees.
 */
function GroupingToggle({ showId, byDivision }: { showId: string; byDivision: boolean }) {
  const save = useUpdateScheduleRules();

  const base =
    'px-[15px] py-[9px] text-[13px] font-bold transition-colors disabled:opacity-60 first:rounded-l-[10px] last:rounded-r-[10px]';

  return (
    <div className="inline-flex overflow-hidden rounded-[10px] border border-[#D9E1DD]">
      <button
        type="button"
        disabled={save.isPending}
        className={cn(base, byDivision ? 'bg-white text-forest' : 'bg-forest text-white')}
        onClick={() => {
          if (byDivision) save.mutate({ showId, awardsByDivision: false });
        }}
      >
        By Test
      </button>
      <button
        type="button"
        disabled={save.isPending}
        title="Splits ribbons per rider division within each award unit — Junior, Young Rider, Adult Amateur and Open place separately."
        className={cn(base, byDivision ? 'bg-forest text-white' : 'bg-white text-forest')}
        onClick={() => {
          if (!byDivision) save.mutate({ showId, awardsByDivision: true });
        }}
      >
        By Division
      </button>
    </div>
  );
}
