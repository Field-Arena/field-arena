'use client';

import Link from 'next/link';
import { PrintDate } from '@/shared/ui/print-date';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { ShowAwards } from '@/modules/shows/data/setup-queries';
import { AwardsToolbar } from '@/modules/shows/ui/awards/awards-toolbar';
import { AwardsReportBody } from '@/modules/shows/ui/awards/awards-report-body';

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
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
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
