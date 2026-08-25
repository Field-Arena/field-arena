'use client';

import Link from 'next/link';
import { PrintDate } from '@/shared/ui/print-date';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import type { ShowAwards } from '@/modules/shows/data/setup-queries';
import { AwardsToolbar } from '@/modules/shows/ui/awards/awards-toolbar';
import { AwardsReportBody } from '@/modules/shows/ui/awards/awards-report-body';

export function AwardsScreen({
  awards,
  shows,
  discipline,
}: {
  awards: ShowAwards;

  shows: { id: string; name: string }[];

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
