'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  CardTitle,
  FA_BTN,
  FA_BTN_DANGER,
  FA_BTN_PRIMARY,
  FA_BTN_SMALL,
  FA_INPUT,
  FA_TABLE,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { BridleNumberPoolStatus } from '@/modules/shows/data/bridle-number-queries';
import {
  useCreateNumberRange,
  useDeleteNumberRange,
  useMarkNumberUnavailable,
  useRestoreNumberAvailability,
} from '@/modules/shows/hooks/use-bridle-number-mutations';
import { BridleNumberAssignDialog } from '@/modules/shows/ui/filing-cabinet/bridle-number-assign-dialog';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

const FIELD_LABEL = 'block space-y-1 text-[12px] font-semibold text-[#5A6B63]';
const FIELD_INPUT = cn(FA_INPUT, 'block h-9 px-2.5 py-1 text-[13px]');

function AddRangeForm({ showId }: { showId: string }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [label, setLabel] = useState('');
  const { mutate, isPending } = useCreateNumberRange();

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <label className={FIELD_LABEL}>
        <span>Start</span>
        <input
          type="number"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
          }}
          className={cn(FIELD_INPUT, 'w-[90px]')}
        />
      </label>
      <label className={FIELD_LABEL}>
        <span>End</span>
        <input
          type="number"
          value={end}
          onChange={(e) => {
            setEnd(e.target.value);
          }}
          className={cn(FIELD_INPUT, 'w-[90px]')}
        />
      </label>
      <label className={FIELD_LABEL}>
        <span>Label (optional)</span>
        <input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
          }}
          placeholder="e.g. Pack A"
          className={cn(FIELD_INPUT, 'w-[140px]')}
        />
      </label>
      <button
        type="button"
        className={FA_BTN_PRIMARY}
        disabled={isPending || !start || !end}
        onClick={() => {
          mutate(
            { showId, rangeStart: start, rangeEnd: end, label: label.trim() || undefined },
            {
              onSuccess: () => {
                setStart('');
                setEnd('');
                setLabel('');
              },
            },
          );
        }}
      >
        {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
        Add range
      </button>
    </div>
  );
}

function MarkUnavailableForm({ showId }: { showId: string }) {
  const [number, setNumber] = useState('');
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useMarkNumberUnavailable();

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <label className={FIELD_LABEL}>
        <span>Number</span>
        <input
          type="number"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
          }}
          className={cn(FIELD_INPUT, 'w-[90px]')}
        />
      </label>
      <label className={FIELD_LABEL}>
        <span>Reason (optional)</span>
        <input
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
          }}
          placeholder="e.g. missing from pack"
          className={cn(FIELD_INPUT, 'w-[180px]')}
        />
      </label>
      <button
        type="button"
        className={FA_BTN}
        disabled={isPending || !number}
        onClick={() => {
          mutate(
            { showId, number, reason: reason.trim() || undefined },
            {
              onSuccess: () => {
                setNumber('');
                setReason('');
              },
            },
          );
        }}
      >
        {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
        Mark unavailable
      </button>
    </div>
  );
}

export function BridleNumbersScreen({
  data,
  availableBridleNumbers,
}: {
  data: BridleNumberPoolStatus;
  availableBridleNumbers: number[];
}) {
  const { showId, showName, ranges, counts, unavailableNumbers, waitingHorses, recentChanges } =
    data;
  const deleteRange = useDeleteNumberRange();
  const restoreNumber = useRestoreNumberAvailability();

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <CabinetSectionHead
        title="Bridle numbers"
        lede={
          <>
            The physical number packs the office has for {showName} — define what&apos;s available,
            mark what&apos;s missing, and see what still needs a number.
          </>
        }
      />

      <StatGrid cols={4}>
        <StatBox label="Available" value={counts.available} tone="green" />
        <StatBox label="Assigned" value={counts.assigned} />
        <StatBox label="Unavailable" value={counts.unavailable} tone="red" />
        <StatBox
          label="Horses waiting"
          value={waitingHorses.length}
          tone={waitingHorses.length > 0 ? 'yellow' : 'default'}
        />
      </StatGrid>

      <FaCard className="mb-4">
        <CardTitle className="mb-3 text-[17px]">Number ranges</CardTitle>
        <div className="mb-4">
          <AddRangeForm showId={showId} />
        </div>
        {ranges.length === 0 ? (
          <p className="text-[13px] font-semibold text-[#5A6B63]">
            No ranges defined yet — add one above (e.g. 201–500) to start assigning numbers.
          </p>
        ) : (
          <table className={FA_TABLE}>
            <caption className="sr-only">Bridle number ranges for {showName}</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Range
                </th>
                <th scope="col" className={FA_TH}>
                  Label
                </th>
                <th scope="col" className={FA_TH}>
                  Total
                </th>
                <th scope="col" className={FA_TH}>
                  Available
                </th>
                <th scope="col" className={FA_TH}>
                  Assigned
                </th>
                <th scope="col" className={FA_TH}>
                  Unavailable
                </th>
                <th scope="col" className={FA_TH} />
              </tr>
            </thead>
            <tbody>
              {ranges.map((r) => (
                <tr key={r.id} className={FA_TR}>
                  <td className={FA_TD}>
                    {r.rangeStart}–{r.rangeEnd}
                  </td>
                  <td className={FA_TD}>{r.label ?? '—'}</td>
                  <td className={FA_TD}>{r.total}</td>
                  <td className={FA_TD}>{r.available}</td>
                  <td className={FA_TD}>{r.assigned}</td>
                  <td className={FA_TD}>{r.unavailable}</td>
                  <td className={FA_TD}>
                    <button
                      type="button"
                      className={FA_BTN_DANGER}
                      disabled={deleteRange.isPending || r.assigned > 0}
                      title={
                        r.assigned > 0
                          ? 'Some numbers from this range are still assigned'
                          : undefined
                      }
                      onClick={() => {
                        deleteRange.mutate({ showId, rangeId: r.id });
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FaCard>

      <FaCard className="mb-4">
        <CardTitle className="mb-3 text-[17px]">Unavailable numbers</CardTitle>
        <div className="mb-4">
          <MarkUnavailableForm showId={showId} />
        </div>
        {unavailableNumbers.length === 0 ? (
          <p className="text-[13px] font-semibold text-[#5A6B63]">
            No numbers are marked unavailable.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {unavailableNumbers.map((n) => (
              <li
                key={n.number}
                className="flex items-center justify-between rounded-[10px] border-[1.5px] border-[#EDF0EE] px-3 py-2 text-[13px]"
              >
                <span>
                  <strong>{n.number}</strong>
                  {n.reason && <span className="ml-2 text-[#5A6B63]">{n.reason}</span>}
                </span>
                <button
                  type="button"
                  className={FA_BTN_SMALL}
                  disabled={restoreNumber.isPending}
                  onClick={() => {
                    restoreNumber.mutate({ showId, number: n.number });
                  }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </FaCard>

      <FaCard className="mb-4">
        <CardTitle className="mb-3 text-[17px]">Horses waiting for a number</CardTitle>
        {waitingHorses.length === 0 ? (
          <p className="text-[13px] font-semibold text-[#5A6B63]">
            Every horse has a bridle number.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {waitingHorses.map((h) => (
              <li
                key={h.showHorseId}
                className="flex items-center justify-between rounded-[10px] border-[1.5px] border-[#EDF0EE] px-3 py-2 text-[13px]"
              >
                <span className="font-semibold">{h.horseName}</span>
                <BridleNumberAssignDialog
                  showId={showId}
                  showHorseId={h.showHorseId}
                  horseName={h.horseName}
                  currentNumber={null}
                  availableNumbers={availableBridleNumbers}
                />
              </li>
            ))}
          </ul>
        )}
      </FaCard>

      {recentChanges.length > 0 && (
        <FaCard>
          <CardTitle className="mb-3 text-[17px]">Recent changes</CardTitle>
          <table className={FA_TABLE}>
            <caption className="sr-only">Bridle number change history for {showName}</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Horse
                </th>
                <th scope="col" className={FA_TH}>
                  Old
                </th>
                <th scope="col" className={FA_TH}>
                  New
                </th>
                <th scope="col" className={FA_TH}>
                  Reason
                </th>
                <th scope="col" className={FA_TH}>
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {recentChanges.map((c) => (
                <tr key={c.id} className={FA_TR}>
                  <td className={cn(FA_TD, 'font-semibold')}>{c.horseName}</td>
                  <td className={FA_TD}>{c.oldNumber ?? '—'}</td>
                  <td className={FA_TD}>{c.newNumber ?? '—'}</td>
                  <td className={FA_TD}>{c.reason ?? '—'}</td>
                  <td className={cn(FA_TD, 'text-[12px] text-[#5A6B63]')}>
                    {formatTimestamp(c.changedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FaCard>
      )}
    </div>
  );
}
