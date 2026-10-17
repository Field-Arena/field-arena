'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { formatDateShort } from '@/shared/lib/format/date';
import type {
  HorseDocumentStatus,
  HorsesPageData,
  HorseRow,
} from '@/modules/shows/data/horses-queries';
import type { StableChartSummary } from '@/modules/shows/data/stable-chart-queries';
import { AddHorseDialog } from '@/modules/shows/ui/horses/add-horse-dialog';
import {
  useRemindHorseDocuments,
  useReviewHorseDocument,
} from '@/modules/shows/hooks/use-horses-mutations';

type HorseState = 'action' | 'review' | 'cleared';
type Filter = 'all' | 'review' | 'problems' | 'missing' | 'cleared' | 'stallions' | 'multi';

const isProblem = (d: HorseDocumentStatus) =>
  d.uploaded && (d.expired || d.status === 'rejected' || d.status === 'replacement_requested');

function horseState(row: HorseRow): HorseState {
  if (row.documents.some((d) => !d.uploaded || isProblem(d))) return 'action';
  if (row.documents.some((d) => d.needsApproval)) return 'review';
  return 'cleared';
}

const STATE_ORDER: Record<HorseState, number> = { action: 0, review: 1, cleared: 2 };
const EDGE: Record<HorseState, string> = {
  action: 'shadow-[inset_5px_0_0_#B4432F]',
  review: 'shadow-[inset_5px_0_0_#C9A227]',
  cleared: 'shadow-[inset_5px_0_0_#1A5B3C]',
};

const pill = 'inline-block rounded-[7px] px-2.5 py-0.5 text-[11.5px] font-extrabold';
const smallBtn =
  'inline-flex cursor-pointer items-center rounded-[7px] border-[1.5px] px-2 py-0.5 text-[12px] font-bold no-underline disabled:opacity-50';

/* Owner's colour scale for how much is cleared. */
function clearedTone(pct: number | null) {
  if (pct === null) return { text: 'text-[#5A6B63]', bar: 'bg-[#EDF0EE]' };
  if (pct <= 50) return { text: 'text-[#B4432F]', bar: 'bg-[#B4432F]' };
  if (pct <= 75) return { text: 'text-[#9A6B00]', bar: 'bg-[#E0A800]' };
  if (pct <= 90) return { text: 'text-[#3E8E5A]', bar: 'bg-[#6CC08B]' };
  return { text: 'text-[#1A5B3C]', bar: 'bg-[#1A5B3C]' };
}

/* One document's cell: where it stands, with view / approve / reject. */
function DocCell({
  doc,
  showId,
  horseId,
}: {
  doc: HorseDocumentStatus | undefined;
  showId: string;
  horseId: string | null;
}) {
  const review = useReviewHorseDocument();
  if (!doc) return <span className="text-[12px] text-[#98A29D]">Not required</span>;

  const view = doc.url ? (
    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="underline">
      view
    </a>
  ) : null;

  if (!doc.uploaded) {
    return <span className={`${pill} bg-[#FCF3E4] text-[#8A6D14]`}>Missing</span>;
  }
  if (doc.expired) {
    return (
      <div className="flex flex-col gap-1">
        <span className={`${pill} bg-[#FDEEEB] text-[#98341F]`}>
          Expired {doc.expirationDate ? formatDateShort(doc.expirationDate) : ''}
        </span>
        <span className="text-[11.5px] font-semibold text-[#5A6B63]">{view}</span>
      </div>
    );
  }
  if (doc.status === 'rejected' || doc.status === 'replacement_requested') {
    return (
      <div className="flex flex-col gap-1">
        <span className={`${pill} bg-[#FDEEEB] text-[#98341F]`}>
          {doc.status === 'rejected' ? 'Rejected' : 'Replacement asked for'}
        </span>
        <span className="text-[11.5px] font-semibold text-[#5A6B63]">
          Waiting on the rider{view ? ' · ' : ''}
          {view}
        </span>
      </div>
    );
  }
  if (doc.needsApproval) {
    return (
      <div className="flex flex-col gap-1">
        <span className={`${pill} bg-[#FCF3E4] text-[#8A6D14]`}>Waiting review</span>
        <div className="flex flex-wrap gap-1.5">
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${smallBtn} border-[#1A5B3C] bg-white text-[#1A5B3C]`}
            >
              View
            </a>
          )}
          {horseId && (
            <>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => {
                  review.mutate({
                    showId,
                    horseId,
                    requirementId: doc.requirementId,
                    status: 'approved',
                  });
                }}
                className={`${smallBtn} border-[#1A5B3C] bg-[#1A5B3C] text-white`}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => {
                  review.mutate({
                    showId,
                    horseId,
                    requirementId: doc.requirementId,
                    status: 'rejected',
                    rejectionReason: 'other',
                  });
                }}
                className={`${smallBtn} border-[#98341F] bg-white text-[#98341F]`}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className={`${pill} bg-[#E9F4EE] text-[#1A5B3C]`}>Approved</span>
      <span className="text-[11.5px] font-semibold text-[#5A6B63]">
        {doc.expirationDate ? `expires ${formatDateShort(doc.expirationDate)}` : ''}
        {doc.expirationDate && view ? ' · ' : ''}
        {view}
      </span>
    </div>
  );
}

/* Step through every document waiting for review, one at a time. */
function ReviewQueue({
  queue,
  showId,
  onClose,
}: {
  queue: { row: HorseRow; doc: HorseDocumentStatus }[];
  showId: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const review = useReviewHorseDocument();
  const item = queue[index];

  const decide = (status: 'approved' | 'rejected') => {
    if (!item?.row.horseId) return;
    review.mutate(
      {
        showId,
        horseId: item.row.horseId,
        requirementId: item.doc.requirementId,
        status,
        ...(status === 'rejected' ? { rejectionReason: 'other' as const } : {}),
      },
      {
        onSuccess: () => {
          setIndex((i) => i + 1);
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review documents"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-xl">
        {item ? (
          <>
            <div className="text-[12.5px] font-semibold text-[#5A6B63]">
              Document {index + 1} of {queue.length} waiting for review
            </div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold text-[#0D2C23]">{item.row.horseName}</h2>
            <p className="mt-1 mb-4 text-[14px] text-[#3F4F48]">
              {item.doc.label} · {item.row.riders.join(', ') || item.row.riderLabel}
              {item.row.entryNumbers.length ? ` · #${item.row.entryNumbers.join(', #')}` : ''}
              {item.doc.expirationDate
                ? ` · expires ${formatDateShort(item.doc.expirationDate)}`
                : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.doc.url && (
                <a
                  href={item.doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-[10px] border-2 border-[#1A5B3C] px-4 text-[14px] font-bold text-[#1A5B3C] no-underline"
                >
                  Open document
                </a>
              )}
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => {
                  decide('approved');
                }}
                className="inline-flex h-11 cursor-pointer items-center rounded-[10px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-5 text-[14px] font-bold text-white disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() => {
                  decide('rejected');
                }}
                className="inline-flex h-11 cursor-pointer items-center rounded-[10px] border-2 border-[#98341F] bg-white px-5 text-[14px] font-bold text-[#98341F] disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndex((i) => i + 1);
                }}
                className="inline-flex h-11 cursor-pointer items-center rounded-[10px] border-[1.5px] border-[#C9D3CE] bg-white px-4 text-[14px] font-bold text-[#5A6B63]"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-0 mb-2 text-[22px] font-bold text-[#0D2C23]">All caught up</h2>
            <p className="m-0 text-[14px] text-[#3F4F48]">
              Every waiting document in this list has been reviewed or skipped.
            </p>
          </>
        )}
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent text-[14px] font-bold text-[#1A5B3C] underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function HorsesScreen({
  data,
  stableChartSummary,
  publicId,
}: {
  data: HorsesPageData;
  stableChartSummary: StableChartSummary | null;
  publicId?: string;
}) {
  const { showId, showName, requirements, rows } = data;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const remind = useRemindHorseDocuments();

  const reqs = requirements.filter((r) => r.label.trim());

  const counts = useMemo(() => {
    const docs = rows.flatMap((r) => r.documents);
    return {
      cleared: rows.filter((r) => horseState(r) === 'cleared').length,
      review: docs.filter((d) => d.needsApproval).length,
      problems: docs.filter(isProblem).length,
      missing: docs.filter((d) => !d.uploaded).length,
      stallions: rows.filter((r) => r.isStallion).length,
      multi: rows.filter((r) => r.isMultiEntry).length,
      reviewHorses: rows.filter((r) => r.documents.some((d) => d.needsApproval)).length,
      problemHorses: rows.filter((r) => r.documents.some(isProblem)).length,
      missingHorses: rows.filter((r) => r.documents.some((d) => !d.uploaded)).length,
    };
  }, [rows]);

  const queue = useMemo(
    () =>
      rows.flatMap((row) =>
        row.documents.filter((d) => d.needsApproval && row.horseId).map((doc) => ({ row, doc })),
      ),
    [rows],
  );

  const needle = query.trim().toLowerCase();
  const visible = rows
    .filter((r) => {
      switch (filter) {
        case 'review':
          return r.documents.some((d) => d.needsApproval);
        case 'problems':
          return r.documents.some(isProblem);
        case 'missing':
          return r.documents.some((d) => !d.uploaded);
        case 'cleared':
          return horseState(r) === 'cleared';
        case 'stallions':
          return r.isStallion;
        case 'multi':
          return r.isMultiEntry;
        default:
          return true;
      }
    })
    .filter(
      (r) =>
        !needle ||
        r.horseName.toLowerCase().includes(needle) ||
        r.riders.some((n) => n.toLowerCase().includes(needle)) ||
        r.riderLabel.toLowerCase().includes(needle) ||
        r.entryNumbers.some((n) => n.includes(needle.replace(/^#/, ''))),
    )
    .sort(
      (a, b) =>
        STATE_ORDER[horseState(a)] - STATE_ORDER[horseState(b)] ||
        a.horseName.localeCompare(b.horseName),
    );

  const clearedPct = rows.length ? Math.round((counts.cleared / rows.length) * 100) : null;
  const tone = clearedTone(clearedPct);
  const box = 'rounded-xl border-[1.5px] border-[#D9E1DD] bg-white px-3.5 py-3';
  const chip = (on: boolean) =>
    `inline-flex h-9 cursor-pointer items-center rounded-full border-2 px-3.5 text-[13px] font-bold ${
      on
        ? 'border-[#1A5B3C] bg-[#1A5B3C] text-white'
        : 'border-[#C9D3CE] bg-white text-[#16261F] hover:border-[#1A5B3C]'
    }`;
  const filters: [Filter, string, number][] = [
    ['all', 'All', rows.length],
    ['review', 'Needs review', counts.reviewHorses],
    ['problems', 'Problems', counts.problemHorses],
    ['missing', 'Missing', counts.missingHorses],
    ['cleared', 'Cleared', counts.cleared],
    ['stallions', 'Stallions', counts.stallions],
    ['multi', 'Multi-rider', counts.multi],
  ];
  const colSpan = 5 + Math.max(reqs.length, 1);

  return (
    <div className="text-[#0D2C23]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-[#5A6B63]">
            {showName} · {rows.length} horse{rows.length === 1 ? '' : 's'} entered
          </div>
          <h1 className="mt-1 mb-0 text-[30px] font-bold">Horses</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/horses/stable-chart?show=${publicId ?? showId}&from=horses`}
            prefetch={false}
            className="inline-flex h-10 items-center rounded-[9px] border-2 border-[#1A5B3C] bg-white px-3.5 text-[13.5px] font-bold text-[#1A5B3C] no-underline"
          >
            🏠 Stable chart
          </Link>
          <AddHorseDialog showId={showId} />
          <button
            type="button"
            disabled={queue.length === 0}
            onClick={() => {
              setReviewing(true);
            }}
            className="inline-flex h-10 cursor-pointer items-center rounded-[9px] border-2 border-[#1A5B3C] bg-[#1A5B3C] px-3.5 text-[13.5px] font-bold text-white disabled:cursor-default disabled:opacity-50"
          >
            Review documents ({queue.length})
          </button>
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className={box}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Cleared to show</div>
          <div className={`mt-0.5 text-[26px] font-bold ${tone.text}`}>
            {clearedPct === null ? '—' : `${String(clearedPct)}%`}
          </div>
          <div className="mt-1.5 h-[7px] rounded bg-[#EDF0EE]">
            {clearedPct !== null && (
              <i
                className={`block h-[7px] rounded ${tone.bar}`}
                style={{ width: `${String(clearedPct)}%` }}
              />
            )}
          </div>
          <div className="mt-1 text-[12px] font-semibold text-[#5A6B63]">
            {counts.cleared} of {rows.length} horses
          </div>
        </div>
        <div className={box}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Waiting your review</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#8A6D14]">{counts.review}</div>
          <div className="text-[12px] font-semibold text-[#5A6B63]">documents uploaded</div>
        </div>
        <div className={box}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Problems</div>
          <div className="mt-0.5 text-[26px] font-bold text-[#B4432F]">{counts.problems}</div>
          <div className="text-[12px] font-semibold text-[#5A6B63]">expired or rejected</div>
        </div>
        <div className={box}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Missing documents</div>
          <div className="mt-0.5 text-[26px] font-bold">{counts.missing}</div>
          <div className="text-[12px] font-semibold text-[#5A6B63]">not uploaded yet</div>
        </div>
        <div className={box}>
          <div className="text-[12.5px] font-semibold text-[#5A6B63]">Stalls</div>
          <div className="mt-0.5 text-[26px] font-bold">
            {stableChartSummary
              ? `${String(stableChartSummary.occupied)} / ${String(stableChartSummary.total)}`
              : '—'}
          </div>
          <div className="text-[12px] font-semibold text-[#5A6B63]">
            {stableChartSummary
              ? `${String(stableChartSummary.available)} available`
              : 'No stable chart yet'}
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {filters.map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            className={chip(filter === key)}
            onClick={() => {
              setFilter(key);
            }}
          >
            {label} ({n})
          </button>
        ))}
        <label className="ml-auto flex h-10 w-[290px] max-w-full items-center gap-2 rounded-[10px] border-2 border-[#C9D3CE] bg-white px-3 focus-within:border-[#1A5B3C]">
          <SearchIcon className="size-4 text-[#98A29D]" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Horse, rider or entry #"
            aria-label="Search horses"
            className="w-full border-0 bg-transparent text-[14px] outline-none"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#C9D3CE] bg-white">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase">
              <th className="px-3 py-2.5">Horse</th>
              <th className="px-3 py-2.5">Rider · Entry</th>
              <th className="px-3 py-2.5">Stable · Trainer</th>
              <th className="px-3 py-2.5">Classes</th>
              {reqs.length > 0 ? (
                reqs.map((r) => (
                  <th key={r.id} className="px-3 py-2.5">
                    {r.label}
                  </th>
                ))
              ) : (
                <th className="px-3 py-2.5">Documents</th>
              )}
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-[14px] text-[#5A6B63]">
                  {rows.length === 0
                    ? 'No horses entered yet — they appear as riders enter, a roster is imported, or you add one by hand.'
                    : 'No horses match.'}
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const state = horseState(row);
              const open = openKey === row.key;
              const missing = row.documents.filter((d) => !d.uploaded).length;
              return (
                <Fragment key={row.key}>
                  <tr
                    className="cursor-pointer border-t border-[#EDF0EE] align-middle hover:bg-[#FBFCFB]"
                    onClick={() => {
                      setOpenKey(open ? null : row.key);
                    }}
                  >
                    <td className={`px-3 py-3 ${EDGE[state]}`}>
                      <div className="text-[15px] font-bold">{row.horseName}</div>
                      <div className="text-[12px] font-semibold text-[#5A6B63]">
                        {row.height ?? ''}
                        {row.isStallion && (
                          <span className="ml-1.5 rounded-md bg-[#EEF3FB] px-1.5 py-px text-[10.5px] font-extrabold text-[#3E6FA8]">
                            STALLION
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.riders.length > 0 ? row.riders.join(', ') : row.riderLabel}
                      <div className="text-[12px] font-semibold text-[#5A6B63]">
                        {row.entryNumbers.map((n) => `#${n}`).join(' · ')}
                        {row.isMultiEntry && <b> · {row.riders.length} riders</b>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] font-semibold text-[#5A6B63]">
                      {row.stable ?? '—'}
                      <br />
                      {row.trainer ?? '—'}
                    </td>
                    <td className="px-3 py-3">{row.classesCount}</td>
                    {reqs.length > 0 ? (
                      reqs.map((r) => (
                        <td
                          key={r.id}
                          className="px-3 py-3"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <DocCell
                            doc={row.documents.find((d) => d.requirementId === r.id)}
                            showId={showId}
                            horseId={row.horseId}
                          />
                        </td>
                      ))
                    ) : (
                      <td className="px-3 py-3 text-[12px] text-[#98A29D]">None required</td>
                    )}
                    <td className="px-3 py-3">
                      {state === 'cleared' ? (
                        <span className={`${pill} bg-[#E9F4EE] text-[#1A5B3C]`}>✓ Cleared</span>
                      ) : state === 'review' ? (
                        <span className={`${pill} bg-[#FCF3E4] text-[#8A6D14]`}>Review</span>
                      ) : (
                        <span className={`${pill} bg-[#FDEEEB] text-[#98341F]`}>Action needed</span>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-[#FBFCFB]">
                      <td colSpan={colSpan} className="px-4 py-3 text-[13px] text-[#3F4F48]">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                          <span>
                            <b>Farrier:</b> {row.farrier ?? '—'}
                          </span>
                          <span>
                            <b>Height:</b> {row.height ?? '—'}
                          </span>
                          <span>
                            <b>Rider email:</b>{' '}
                            {row.riderEmail ? (
                              <a href={`mailto:${row.riderEmail}`}>{row.riderEmail}</a>
                            ) : (
                              '—'
                            )}
                          </span>
                          {missing > 0 && row.horseId && row.riderEmail && (
                            <button
                              type="button"
                              disabled={remind.isPending}
                              onClick={() => {
                                if (row.horseId) remind.mutate({ showId, horseId: row.horseId });
                              }}
                              className={`${smallBtn} border-[#1A5B3C] bg-white text-[#1A5B3C]`}
                            >
                              Remind rider about {missing} missing document
                              {missing === 1 ? '' : 's'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[12.5px] font-semibold text-[#5A6B63]">
        Horses that need you sort to the top. Click a horse to see farrier, height and rider email.
        “Review documents” steps through every waiting document one at a time.
      </p>

      {reviewing && (
        <ReviewQueue
          queue={queue}
          showId={showId}
          onClose={() => {
            setReviewing(false);
          }}
        />
      )}
    </div>
  );
}
