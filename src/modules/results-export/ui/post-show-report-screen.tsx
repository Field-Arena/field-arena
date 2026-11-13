import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { formatMoney } from '@/shared/lib/format/currency';
import {
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FaCard,
  PageHeader,
  Pill,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import type { PostShowReport } from '@/modules/results-export/types';
import type { ReadinessKey, ReadinessState } from '@/modules/results-export/utils/readiness';
import { EXPORT_FORMAT_OPTIONS, exportHref } from '@/modules/results-export/ui/export-formats';

const MARK: Record<ReadinessState, { mark: string; dot: string }> = {
  done: { mark: '✓', dot: 'bg-[#1A5B3C]' },
  warn: { mark: '!', dot: 'bg-[#E0A800]' },
  todo: { mark: '✕', dot: 'bg-[#B4432F]' },
};

/* Where each unfinished line is fixed. */
function fixLink(key: ReadinessKey, ref: string): { href: string; label: string } {
  const q = `?show=${encodeURIComponent(ref)}`;
  switch (key) {
    case 'comp-id':
    case 'section-codes':
      return { href: `/dashboard/shows/${ref}/select-events`, label: 'fix in Select Events' };
    case 'scored':
      return { href: `/dashboard/shows/${ref}/results`, label: 'see Results' };
    case 'rider-usef':
      return { href: `/dashboard/riders${q}`, label: 'see riders' };
    case 'horse-usef':
    case 'owner':
      return { href: `/dashboard/horses${q}`, label: 'see horses' };
    case 'judge-usef':
      return { href: `/dashboard/users${q}`, label: 'see judges' };
  }
}

function dateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  const year = start.slice(0, 4);
  return end && end !== start ? `${fmt(start)}–${fmt(end)}, ${year}` : `${fmt(start)}, ${year}`;
}

/* Post-show report: the show's numbers, a "ready to send to USEF?" checklist,
 * and the export downloads. */
export function PostShowReportScreen({
  report,
  showRef,
  canExport,
}: {
  report: PostShowReport;
  showRef: string;
  canExport: boolean;
}) {
  const subline = [dateRange(report.startDate, report.endDate), report.venue]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <PageHeader
        eyebrow={subline || undefined}
        title={`Post-show report — ${report.showName}`}
        actions={
          canExport ? (
            <a href={exportHref(showRef, 'xlsx')} download className={FA_BTN_PRIMARY}>
              <span aria-hidden>⬇</span> Export Excel
            </a>
          ) : undefined
        }
      />

      <StatGrid cols={5}>
        <StatBox
          label="Classes"
          value={report.classes}
          note={`${String(report.days)} day${report.days === 1 ? '' : 's'} · ${String(report.rings)} ring${report.rings === 1 ? '' : 's'}`}
        />
        <StatBox
          label="Entries"
          value={report.entries}
          note={`${String(report.riders)} riders · ${String(report.horses)} horses`}
        />
        <StatBox
          label="Scored"
          value={report.scored}
          tone="green"
          note={`${String(report.scratched)} scratched`}
        />
        <StatBox
          label="Results published"
          value={`${String(report.resultsPublished)} of ${String(report.classes)}`}
          note="classes"
        />
        <StatBox label="Revenue" value={formatMoney(report.revenue)} note="entries + vendors" />
      </StatGrid>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <FaCard className="p-[20px_22px]">
          <h2 className="font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Ready to send to USEF?
          </h2>
          <ul className="m-0 mt-2 list-none p-0">
            {report.readiness.map((item) => {
              const mark = MARK[item.state];
              const fix = item.state === 'done' ? null : fixLink(item.key, showRef);
              return (
                <li key={item.key} className="flex items-center gap-3 py-2 text-[15px]">
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-5 flex-none place-items-center rounded-full text-[12px] font-extrabold text-white',
                      mark.dot,
                    )}
                  >
                    {mark.mark}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[13px] font-semibold text-[#5A6B63]">
                    {item.detail}
                    {fix && (
                      <>
                        {' · '}
                        <Link href={fix.href} prefetch={false} className="underline">
                          {fix.label}
                        </Link>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </FaCard>

        <FaCard className="p-[20px_22px]">
          <h2 className="font-[family-name:var(--ws-fraunces)] text-[22px] font-bold text-[#0D2C23]">
            Export
          </h2>
          {canExport ? (
            <ul className="m-0 mt-2 grid list-none gap-2 p-0">
              {EXPORT_FORMAT_OPTIONS.map((option) => (
                <li key={option.format}>
                  <FaCard className="flex items-center justify-between gap-3 p-[10px_14px]">
                    <div className="min-w-0">
                      <span className="font-bold">{option.label}</span>
                      {option.tag && (
                        <Pill tone="yellow" className="ml-2">
                          {option.tag}
                        </Pill>
                      )}
                      <p className="text-[12.5px] font-medium text-[#5A6B63]">
                        {option.format === 'xlsx' || option.format === 'csv'
                          ? `142 USEF columns, ${String(report.exportRows)} rows`
                          : option.blurb}
                      </p>
                    </div>
                    <a href={exportHref(showRef, option.format)} download className={FA_BTN_SMALL}>
                      Download
                    </a>
                  </FaCard>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13.5px] text-[#5A6B63]">
              You don&apos;t have permission to export results for this show. Ask the organizer.
            </p>
          )}
          <p className="mt-3 text-[12.5px] font-medium text-[#5A6B63]">
            You can export any time. The file is built from live results, so it always matches the
            Results page. Only people with export permission see this.
          </p>
        </FaCard>
      </div>
    </div>
  );
}
