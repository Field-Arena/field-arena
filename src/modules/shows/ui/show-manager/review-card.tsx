'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { formatMoney } from '@/shared/lib/format/currency';
import { calcPlatformFee } from '@/shared/lib/fees';
import { useUpdateClassReview, useRemoveClass } from '../../hooks/use-schedule-review-mutations';
import type { ScheduleReviewData } from '../../data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_ROW_INPUT, SM_GREEN_BTN } from './tokens';

/**
 * "Review" — every class on this show, editable in one table, ported from
 * showstaff.html's renderReviewView. Location stays read-only here: it's set
 * from the show's rings back in Select Events, not re-editable per class.
 * "Estimated entries per class" is the legacy view's own local-only
 * projection input (smReviewEntriesPerClass) — it drives the totals below but
 * has no backing column, same as the source.
 */
export function ReviewCard({ data }: { data: ScheduleReviewData }) {
  const [rows, setRows] = useState(data.classes);
  const [entriesPerClass, setEntriesPerClass] = useState(5);
  const { mutate: update } = useUpdateClassReview();
  const { mutate: remove } = useRemoveClass();

  /**
   * Each field commits as its own request carrying only that one field — see
   * updateClassReviewSchema's note on why a merged full-row payload here
   * would let two fields blurring close together race and clobber each
   * other's write.
   */
  function commit(id: string, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    update({ classId: id, showId: data.showId, ...patch });
  }

  function commitRemove(id: string) {
    setRows((r) => r.filter((c) => c.id !== id));
    remove({ classId: id, showId: data.showId });
  }

  const totalClasses = rows.length;
  const judgeAssignments = rows.reduce((sum, r) => sum + r.judgesCount, 0);
  const projectedFees = rows.reduce((sum, r) => sum + r.fee * entriesPerClass, 0);

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Review</h2>
        <p className={SM_NOTE}>
          Everything configured for this show, class by class — arena, judges, and fees, all
          editable here.
        </p>

        {rows.length === 0 ? (
          <p className="text-[13px] italic text-[#98A29D]">
            No classes scheduled yet — pick some in{' '}
            <Link
              href={`/dashboard/shows/${data.showId}/select-events`}
              className="font-semibold text-forest underline underline-offset-2"
            >
              Select Events
            </Link>{' '}
            first.
          </p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full min-w-[840px] border-collapse text-[13.5px]">
                <caption className="sr-only">Classes on this show, editable</caption>
                <thead>
                  <tr className="border-b border-[#E9EDEB]">
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Event
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Class
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Division
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Location
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Arena
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Judges
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-right text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Entry fee
                    </th>
                    <th scope="col" className="px-2.5 py-2 text-right text-[11px] font-bold uppercase tracking-[.06em] text-[#6E7C76]">
                      Platform fee
                    </th>
                    <th scope="col" className="px-2.5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-[#EEF2F0]">
                      <td className="px-2.5 py-2 whitespace-nowrap">{c.event ?? '—'}</td>
                      <td className="px-2.5 py-2">
                        <strong>{c.displayName ?? c.label}</strong>
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap">{c.division ?? '—'}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap">{c.location ?? '—'}</td>
                      <td className="px-2.5 py-2">
                        <input
                          defaultValue={c.arena ?? ''}
                          className={`${SM_ROW_INPUT} w-[150px]`}
                          onBlur={(e) => {
                            commit(c.id, { arena: e.target.value || null });
                          }}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          defaultValue={c.judgesCount}
                          className={`${SM_ROW_INPUT} w-14`}
                          onBlur={(e) => {
                            const n = Number.parseInt(e.target.value, 10);
                            commit(c.id, { judgesCount: Number.isFinite(n) && n > 0 ? n : 1 });
                          }}
                        />
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={c.fee}
                          className={`${SM_ROW_INPUT} w-16 text-right`}
                          onBlur={(e) => {
                            const n = Number.parseFloat(e.target.value);
                            commit(c.id, { fee: Number.isFinite(n) && n >= 0 ? n : 0 });
                          }}
                        />
                      </td>
                      <td className="px-2.5 py-2 text-right whitespace-nowrap">
                        {formatMoney(calcPlatformFee(c.fee, data.feeModel))}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            commitRemove(c.id);
                          }}
                          className="bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:text-status-danger"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-[18px] flex items-center gap-2.5 rounded-[8px] bg-cream px-4 py-3">
              <label htmlFor="entries-per-class" className="m-0 text-[13px]">
                Estimated entries per class
              </label>
              <input
                id="entries-per-class"
                type="number"
                min={0}
                step={1}
                value={entriesPerClass}
                className={`${SM_ROW_INPUT} w-[70px]`}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setEntriesPerClass(Number.isFinite(n) && n >= 0 ? n : 0);
                }}
              />
              <span className="text-[12px] text-[#6E7C76]">
                Projections below assume this many riders in each class.
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <p className={SM_NOTE + ' mb-1'}>Total classes</p>
                <div className="text-xl font-bold text-ink-deep">{totalClasses}</div>
              </div>
              <div>
                <p className={SM_NOTE + ' mb-1'}>Judge assignments</p>
                <div className="text-xl font-bold text-ink-deep">{judgeAssignments}</div>
              </div>
              <div>
                <p className={SM_NOTE + ' mb-1'}>Projected entry fees</p>
                <div className="text-xl font-bold text-ink-deep">{formatMoney(projectedFees)}</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[#EDF0EE] bg-white px-6 py-5">
        <p className="min-w-0 text-[13px] text-[#6E7C76]">
          Ticket sales and going live are handled from the lifecycle steps above — once ready, use
          &quot;Open ticket sales&quot; and &quot;Approve schedule &amp; go live&quot; on Run Show.
        </p>
        <Link href={`/dashboard/shows/${data.showId}/run-show`} className={`${SM_GREEN_BTN} ml-auto`}>
          Continue to Run Show →
        </Link>
      </div>
    </>
  );
}
