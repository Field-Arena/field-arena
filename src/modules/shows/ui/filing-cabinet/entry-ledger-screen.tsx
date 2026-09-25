'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrinterIcon } from 'lucide-react';
import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { Input } from '@/shared/ui/shadcn/input';
import { formatMoney } from '@/shared/lib/format/currency';
import { SHOW_ENTRY_STATUS_LABELS } from '@/modules/shows/constants';
import type { EntryLedgerPageData, DocumentRollupStatus } from '@/modules/shows/data/entry-ledger-queries';
import { useUpdateEntryNumber, useUpdateBackNumber } from '@/modules/shows/hooks/use-entry-ledger-mutations';
import { EntryDetailDialog } from '@/modules/shows/ui/filing-cabinet/entry-detail-dialog';
import { BridleNumberAssignDialog } from '@/modules/shows/ui/filing-cabinet/bridle-number-assign-dialog';
import { BackNumberReprintButton } from '@/modules/shows/ui/filing-cabinet/back-number-reprint-button';

const DOC_STATUS_TONE: Record<DocumentRollupStatus, StatusTone> = {
  complete: 'success',
  needs_attention: 'warn',
  missing: 'danger',
};

const DOC_STATUS_LABEL: Record<DocumentRollupStatus, string> = {
  complete: 'Complete',
  needs_attention: 'Needs attention',
  missing: 'Missing',
};

const STATUS_TONE: Record<string, StatusTone> = {
  submitted: 'neutral',
  documents_received: 'info',
  documents_verified: 'info',
  checkin_released: 'warn',
  cleared: 'success',
  scratched: 'danger',
};

function NumberCell({
  value,
  onSave,
  pending,
}: {
  value: string;
  onSave: (next: string) => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <Input
      value={draft}
      disabled={pending}
      className="h-8 w-[84px] text-[13px]"
      onChange={(e) => {
        setDraft(e.target.value);
      }}
      onBlur={() => {
        if (draft.trim() && draft !== value) onSave(draft.trim());
        else setDraft(value);
      }}
    />
  );
}

export function EntryLedgerScreen({
  data,
  publicId,
  availableBridleNumbers,
}: {
  data: EntryLedgerPageData;
  publicId?: string;
  availableBridleNumbers: number[];
}) {
  const { showId, showName, rows } = data;
  const linkId = publicId ?? showId;
  const updateEntryNumber = useUpdateEntryNumber();
  const updateBackNumber = useUpdateBackNumber();
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const openRow = rows.find((r) => r.showEntryId === openEntryId) ?? null;

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ScreenTitle className="mb-1.5">Entry Ledger</ScreenTitle>
          <ScreenLede className="mb-0">
            Who entered {showName}, what they bought, what they entered, and what still needs
            attention. Reads the same entries and payments used everywhere else — edits here
            correct the entry/bridle/back number only.
          </ScreenLede>
        </div>
        <Link
          href={`/dashboard/documents/print-center?show=${linkId}`}
          prefetch={false}
          className="inline-flex"
        >
          <GhostButton>
            <PrinterIcon className="size-4" aria-hidden />
            Print Center
          </GhostButton>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            No entries yet — rows appear here as riders check out, or when entries are added by
            hand.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableCaption className="sr-only">Entry ledger for {showName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Entry #</TableHead>
                <TableHead scope="col">Bridle #</TableHead>
                <TableHead scope="col">Back #</TableHead>
                <TableHead scope="col">Rider</TableHead>
                <TableHead scope="col">Horse</TableHead>
                <TableHead scope="col">Classes</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Fees</TableHead>
                <TableHead scope="col">Paid</TableHead>
                <TableHead scope="col">Balance</TableHead>
                <TableHead scope="col">Documents</TableHead>
                <TableHead scope="col">Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.showEntryId}
                  className="cursor-pointer"
                  onClick={() => {
                    setOpenEntryId(row.showEntryId);
                  }}
                >
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <NumberCell
                      value={row.entryNumber}
                      pending={updateEntryNumber.isPending}
                      onSave={(next) => {
                        updateEntryNumber.mutate({ showId, showEntryId: row.showEntryId, entryNumber: next });
                      }}
                    />
                  </TableCell>
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <BridleNumberAssignDialog
                      showId={showId}
                      showHorseId={row.showHorseId}
                      horseName={row.horseName}
                      currentNumber={row.bridleNumber}
                      availableNumbers={availableBridleNumbers}
                    />
                  </TableCell>
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <NumberCell
                        value={row.backNumber ?? ''}
                        pending={updateBackNumber.isPending}
                        onSave={(next) => {
                          updateBackNumber.mutate({ showId, showEntryId: row.showEntryId, backNumber: next });
                        }}
                      />
                      {row.backNumber && (
                        <BackNumberReprintButton showId={showId} showEntryId={row.showEntryId} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate font-semibold" title={row.riderName}>
                    {row.riderName}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate" title={row.horseName}>
                    {row.horseName}
                  </TableCell>
                  <TableCell
                    className="max-w-[220px] truncate text-[12.5px]"
                    title={row.classes.join(', ') || undefined}
                  >
                    {row.classes.join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={STATUS_TONE[row.status] ?? 'neutral'}>
                      {SHOW_ENTRY_STATUS_LABELS[row.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatMoney(row.fees)}</TableCell>
                  <TableCell>{formatMoney(row.amountPaid)}</TableCell>
                  <TableCell className={row.balance > 0 ? 'text-status-danger font-semibold' : ''}>
                    {formatMoney(row.balance)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={DOC_STATUS_TONE[row.documentStatus]}>
                      {DOC_STATUS_LABEL[row.documentStatus]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {row.openIssueCount > 0 ? (
                      <Link
                        href={`/dashboard/documents/issues?show=${linkId}`}
                        prefetch={false}
                        className="text-status-danger font-bold underline"
                      >
                        {row.openIssueCount}
                      </Link>
                    ) : (
                      <span className="text-[#7A8781]">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <EntryDetailDialog
        row={openRow}
        onClose={() => {
          setOpenEntryId(null);
        }}
      />
    </div>
  );
}
