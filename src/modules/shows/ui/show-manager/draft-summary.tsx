import Link from 'next/link';
import type { CompletenessSection } from '@/modules/shows/types';
import { formatDateRange } from '@/shared/lib/format/date';

/* Where each completeness section is fixed: an anchor on the Setup tab, or
 * another Show Manager tab. */
const SECTION_TARGET: Record<string, string> = {
  'Show Details': '#show-details',
  Venue: '#venue',
  'Class Divisions': '#class-divisions',
  'Select Events': '/select-events',
  'Required Documents': '/documents',
  'Merchandise Sales': '#merchandise',
  Staffing: '#venue',
  'Waiver of Liability': '#waiver',
};

/** The redesign's right-hand Setup panel: what the show is so far, how much of
 * setup is done, and what's left — each item jumps to where it's fixed. */
export function DraftSummary({
  publicId,
  name,
  startDate,
  endDate,
  venueName,
  governingBodies,
  sections,
  stage,
  publicUrl,
}: {
  publicId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
  governingBodies: string[];
  sections: CompletenessSection[];
  stage: string;
  publicUrl: string;
}) {
  const done = sections.filter((s) => s.ok).length;
  const percent = sections.length === 0 ? 0 : Math.round((done / sections.length) * 100);
  const open = sections.filter((s) => !s.ok);
  const inSetup = stage === 'setup';
  const hrefFor = (target: string) =>
    target.startsWith('#') ? target : `/dashboard/shows/${publicId}${target}`;

  return (
    <div className="fa-aside-card fa-comp-panel">
      <h4 className="!mb-2">{inSetup ? 'Draft summary' : 'Show summary'}</h4>
      <div className="mb-3.5 font-[family-name:var(--fa-serif)] text-[19px] leading-tight font-semibold text-[var(--fa-ink)]">
        {name}
      </div>
      <div className="fa-kv">
        <span className="fa-k">Dates</span>
        <span className="fa-v">{formatDateRange(startDate, endDate) || 'TBD'}</span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Venue</span>
        <span className="fa-v">{venueName ?? 'Not set'}</span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Bodies</span>
        <span className="fa-v">
          {governingBodies.length > 0 ? governingBodies.join(' · ') : 'Schooling'}
        </span>
      </div>

      <div className="mt-4">
        <div className="fa-comp-prog-top">
          <span className="!text-[12.5px] !font-semibold !text-[var(--fa-ink-2)]">
            Setup readiness <b className="ml-1 !text-[15px]">{percent}%</b>
          </span>
        </div>
        <div
          className="fa-prog !w-full"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${String(percent)}%` }} />
        </div>
        <p className="mt-2 mb-0 text-[12px] text-[var(--fa-ink-3)]">
          {open.length === 0
            ? 'All required details complete.'
            : `${String(open.length)} section${open.length === 1 ? '' : 's'} still open.`}
        </p>
      </div>

      <div className="fa-comp-list">
        {sections.map((section) => {
          const missing = section.items.find((i) => !i.ok)?.label;
          return (
            <Link
              key={section.name}
              href={hrefFor(SECTION_TARGET[section.name] ?? '#show-details')}
              prefetch={false}
              className={`fa-comp-item ${section.ok ? 'fa-ok' : 'fa-warn'} no-underline`}
            >
              <span className="fa-ci">{section.ok ? '✓' : '!'}</span>
              <span className="fa-ct">
                <b>{section.name}</b>
                {!section.ok && missing && <span>{missing}</span>}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {inSetup ? (
          <Link
            href={`/dashboard/shows/${publicId}/run-show`}
            prefetch={false}
            className="fa-btn fa-btn-primary justify-center"
          >
            Open ticket sales
          </Link>
        ) : (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="fa-btn fa-btn-ghost justify-center"
          >
            View ticket page ↗
          </a>
        )}
        <span className="fa-autosave-inline">
          <span className="fa-as-dot" />
          Details save automatically
        </span>
      </div>
    </div>
  );
}
