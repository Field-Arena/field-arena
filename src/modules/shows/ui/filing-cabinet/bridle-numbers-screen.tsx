'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton, GoldButton, DangerButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { formatTimestamp } from '@/shared/lib/format/date';
import type { BridleNumberPoolStatus } from '@/modules/shows/data/bridle-number-queries';
import {
  useCreateNumberRange,
  useDeleteNumberRange,
  useMarkNumberUnavailable,
  useRestoreNumberAvailability,
} from '@/modules/shows/hooks/use-bridle-number-mutations';
import { BridleNumberAssignDialog } from '@/modules/shows/ui/filing-cabinet/bridle-number-assign-dialog';

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-[10px] border border-[#E9EDEB] bg-[#FAFAF6] px-4 py-3">
      <div className="text-[10.5px] font-bold tracking-[.08em] text-[#7A8781] uppercase">{label}</div>
      <div className="text-forest mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function AddRangeForm({ showId }: { showId: string }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [label, setLabel] = useState('');
  const { mutate, isPending } = useCreateNumberRange();

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <div className="space-y-1">
        <Label className="text-[11px]">Start</Label>
        <Input
          type="number"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
          }}
          className="h-8 w-[90px] text-[13px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">End</Label>
        <Input
          type="number"
          value={end}
          onChange={(e) => {
            setEnd(e.target.value);
          }}
          className="h-8 w-[90px] text-[13px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Label (optional)</Label>
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
          }}
          placeholder="e.g. Pack A"
          className="h-8 w-[140px] text-[13px]"
        />
      </div>
      <GoldButton
        type="button"
        className="h-8 px-3 py-0 text-[13px]"
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
      </GoldButton>
    </div>
  );
}

function MarkUnavailableForm({ showId }: { showId: string }) {
  const [number, setNumber] = useState('');
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useMarkNumberUnavailable();

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <div className="space-y-1">
        <Label className="text-[11px]">Number</Label>
        <Input
          type="number"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
          }}
          className="h-8 w-[90px] text-[13px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Reason (optional)</Label>
        <Input
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
          }}
          placeholder="e.g. missing from pack"
          className="h-8 w-[180px] text-[13px]"
        />
      </div>
      <GhostButton
        type="button"
        className="h-8 px-3 py-0 text-[13px]"
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
      </GhostButton>
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
  const { showId, showName, ranges, counts, unavailableNumbers, waitingHorses, recentChanges } = data;
  const deleteRange = useDeleteNumberRange();
  const restoreNumber = useRestoreNumberAvailability();

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4">
        <ScreenTitle className="mb-1.5">Bridle Numbers</ScreenTitle>
        <ScreenLede className="mb-0">
          The physical number packs the office has for {showName} — define what&apos;s available,
          mark what&apos;s missing, and see what still needs a number.
        </ScreenLede>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <StatTile label="Available" value={counts.available} />
        <StatTile label="Assigned" value={counts.assigned} />
        <StatTile label="Unavailable" value={counts.unavailable} />
        <StatTile label="Horses waiting" value={waitingHorses.length} />
      </div>

      <Card className="mb-4 p-[18px_20px_20px]">
        <h2 className="mb-3 text-[14px] font-bold">Number ranges</h2>
        <div className="mb-4">
          <AddRangeForm showId={showId} />
        </div>
        {ranges.length === 0 ? (
          <p className="text-[13px] text-[#7A8781] italic">
            No ranges defined yet — add one above (e.g. 201–500) to start assigning numbers.
          </p>
        ) : (
          <Table>
            <TableCaption className="sr-only">Bridle number ranges for {showName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Range</TableHead>
                <TableHead scope="col">Label</TableHead>
                <TableHead scope="col">Total</TableHead>
                <TableHead scope="col">Available</TableHead>
                <TableHead scope="col">Assigned</TableHead>
                <TableHead scope="col">Unavailable</TableHead>
                <TableHead scope="col" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.rangeStart}–{r.rangeEnd}
                  </TableCell>
                  <TableCell>{r.label ?? '—'}</TableCell>
                  <TableCell>{r.total}</TableCell>
                  <TableCell>{r.available}</TableCell>
                  <TableCell>{r.assigned}</TableCell>
                  <TableCell>{r.unavailable}</TableCell>
                  <TableCell>
                    <DangerButton
                      type="button"
                      className="h-7 px-2.5 py-0 text-[12px]"
                      disabled={deleteRange.isPending || r.assigned > 0}
                      title={r.assigned > 0 ? 'Some numbers from this range are still assigned' : undefined}
                      onClick={() => {
                        deleteRange.mutate({ showId, rangeId: r.id });
                      }}
                    >
                      Remove
                    </DangerButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="mb-4 p-[18px_20px_20px]">
        <h2 className="mb-3 text-[14px] font-bold">Unavailable numbers</h2>
        <div className="mb-4">
          <MarkUnavailableForm showId={showId} />
        </div>
        {unavailableNumbers.length === 0 ? (
          <p className="text-[13px] text-[#7A8781] italic">No numbers are marked unavailable.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {unavailableNumbers.map((n) => (
              <li
                key={n.number}
                className="flex items-center justify-between rounded-lg border border-[#E9EDEB] px-3 py-2 text-[13px]"
              >
                <span>
                  <strong>{n.number}</strong>
                  {n.reason && <span className="ml-2 text-[#7A8781]">{n.reason}</span>}
                </span>
                <GhostButton
                  type="button"
                  className="h-7 px-2.5 py-0 text-[12px]"
                  disabled={restoreNumber.isPending}
                  onClick={() => {
                    restoreNumber.mutate({ showId, number: n.number });
                  }}
                >
                  Restore
                </GhostButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-4 p-[18px_20px_20px]">
        <h2 className="mb-3 text-[14px] font-bold">Horses waiting for a number</h2>
        {waitingHorses.length === 0 ? (
          <p className="text-[13px] text-[#7A8781] italic">Every horse has a bridle number.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {waitingHorses.map((h) => (
              <li
                key={h.showHorseId}
                className="flex items-center justify-between rounded-lg border border-[#E9EDEB] px-3 py-2 text-[13px]"
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
      </Card>

      {recentChanges.length > 0 && (
        <Card className="p-[18px_20px_20px]">
          <h2 className="mb-3 text-[14px] font-bold">Recent changes</h2>
          <Table>
            <TableCaption className="sr-only">Bridle number change history for {showName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Horse</TableHead>
                <TableHead scope="col">Old</TableHead>
                <TableHead scope="col">New</TableHead>
                <TableHead scope="col">Reason</TableHead>
                <TableHead scope="col">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentChanges.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.horseName}</TableCell>
                  <TableCell>{c.oldNumber ?? '—'}</TableCell>
                  <TableCell>{c.newNumber ?? '—'}</TableCell>
                  <TableCell>{c.reason ?? '—'}</TableCell>
                  <TableCell className="text-[12px] text-[#7A8781]">
                    {formatTimestamp(c.changedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
