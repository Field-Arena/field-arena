'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import { cn } from '@/shared/lib/utils';
import { formatMoney } from '@/shared/lib/format/currency';
import { calcPlatformFee } from '@/shared/lib/fees';
import {
  useUpdateClassReview,
  useRemoveClass,
} from '@/modules/shows/hooks/use-schedule-review-mutations';
import type { ScheduleReviewData } from '@/modules/shows/data/setup-queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_ROW_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';

const REVIEW_TABLE_HEAD =
  'px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase';

export function ReviewCard({ data }: { data: ScheduleReviewData }) {
  const [rows, setRows] = useState(data.classes);
  const [entriesPerClass, setEntriesPerClass] = useState(5);
  const { mutate: update } = useUpdateClassReview();
  const { mutate: remove } = useRemoveClass();

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
          <p className="text-[13px] text-[#98A29D] italic">
            No classes scheduled yet — pick some in{' '}
            <Link
              href={`/dashboard/shows/${data.showId}/select-events`}
              className="text-forest font-semibold underline underline-offset-2"
            >
              Select Events
            </Link>{' '}
            first.
          </p>
        ) : (
          <>
            <Table className="w-full min-w-[900px] border-collapse text-[13.5px]">
              <TableCaption className="sr-only">Classes on this show, editable</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-[#E9EDEB] hover:bg-transparent">
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Event
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Class
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Division
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Location
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Arena
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Sponsor
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD)}>
                    Judges
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD, 'text-right')}>
                    Entry fee
                  </TableHead>
                  <TableHead scope="col" className={cn('h-auto', REVIEW_TABLE_HEAD, 'text-right')}>
                    Platform fee
                  </TableHead>
                  <TableHead scope="col" className="h-auto px-2.5 py-2" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-b border-[#EEF2F0] transition-colors hover:bg-[#FAFBF8] [&>td]:align-middle"
                  >
                    <TableCell className="px-2.5 py-2 whitespace-normal">
                      <span
                        className="block max-w-[150px] truncate text-[#6E7C76]"
                        title={c.event ?? undefined}
                      >
                        {c.event ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-nowrap">
                      <strong>{c.displayName ?? c.label}</strong>
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-nowrap">
                      {c.division ?? '—'}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-nowrap">
                      {c.location ?? '—'}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-normal">
                      <Input
                        defaultValue={c.arena ?? ''}
                        className={cn('h-auto', SM_ROW_INPUT, 'w-[150px]!')}
                        onBlur={(e) => {
                          commit(c.id, { arena: e.target.value || null });
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-normal">
                      <Input
                        defaultValue={c.sponsor ?? ''}
                        placeholder="—"
                        className={cn('h-auto', SM_ROW_INPUT, 'w-[160px]!')}
                        onBlur={(e) => {
                          commit(c.id, { sponsor: e.target.value.trim() || null });
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-normal">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={c.judgesCount}
                        className={cn('h-auto', SM_ROW_INPUT, 'w-[64px]! appearance-none')}
                        onBlur={(e) => {
                          const n = Number.parseInt(e.target.value, 10);
                          commit(c.id, { judgesCount: Number.isFinite(n) && n > 0 ? n : 1 });
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={c.fee}
                        className={cn(
                          'h-auto',
                          SM_ROW_INPUT,
                          'w-[90px]! appearance-none text-right',
                        )}
                        onBlur={(e) => {
                          const n = Number.parseFloat(e.target.value);
                          commit(c.id, { fee: Number.isFinite(n) && n >= 0 ? n : 0 });
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-2.5 py-2 text-right whitespace-nowrap">
                      {formatMoney(calcPlatformFee(c.fee, data.feeModel))}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          commitRemove(c.id);
                        }}
                        className="hover:text-status-danger h-auto bg-transparent p-0 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:bg-transparent"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-cream mt-[18px] flex items-center gap-2.5 rounded-[8px] px-4 py-3">
              <Label htmlFor="entries-per-class" className="m-0 text-[13px]">
                Estimated entries per class
              </Label>
              <Input
                id="entries-per-class"
                type="number"
                min={0}
                step={1}
                value={entriesPerClass}
                className={cn('h-auto', SM_ROW_INPUT, 'w-[70px]! appearance-none')}
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
                <div className="text-ink-deep text-xl font-bold">{totalClasses}</div>
              </div>
              <div>
                <p className={SM_NOTE + ' mb-1'}>Judge assignments</p>
                <div className="text-ink-deep text-xl font-bold">{judgeAssignments}</div>
              </div>
              <div>
                <p className={SM_NOTE + ' mb-1'}>Projected entry fees</p>
                <div className="text-ink-deep text-xl font-bold">{formatMoney(projectedFees)}</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <SectionFooter
        currentTab="Schedule / Review"
        showId={data.showId}
        blockedReason={
          rows.length === 0
            ? 'No classes are scheduled yet — add some in Select Events before moving on.'
            : null
        }
      />
    </>
  );
}
