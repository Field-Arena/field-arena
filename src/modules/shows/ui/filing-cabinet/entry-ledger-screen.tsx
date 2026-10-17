'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrinterIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_BTN,
  FA_INPUT,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import { formatMoney } from '@/shared/lib/format/currency';
import { SHOW_ENTRY_STATUS_LABELS } from '@/modules/shows/constants';
import type {
  EntryLedgerPageData,
  DocumentRollupStatus,
} from '@/modules/shows/data/entry-ledger-queries';
import {
  useUpdateEntryNumber,
  useUpdateBackNumber,
} from '@/modules/shows/hooks/use-entry-ledger-mutations';
import { EntryDetailDialog } from '@/modules/shows/ui/filing-cabinet/entry-detail-dialog';
import { BridleNumberAssignDialog } from '@/modules/shows/ui/filing-cabinet/bridle-number-assign-dialog';
import { BackNumberReprintButton } from '@/modules/shows/ui/filing-cabinet/back-number-reprint-button';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

const DOC_STATUS_TONE: Record<DocumentRollupStatus, PillTone> = {
  complete: 'green',
  needs_attention: 'yellow',
  missing: 'red',
};

const DOC_STATUS_LABEL: Record<DocumentRollupStatus, string> = {
  complete: 'Complete',
  needs_attention: 'Needs attention',
  missing: 'Missing',
};

const STATUS_TONE: Record<string, PillTone> = {
  submitted: 'grey',
  documents_received: 'blue',
  documents_verified: 'blue',
  checkin_released: 'yellow',
  cleared: 'green',
  scratched: 'red',
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
    <input
      value={draft}
      disabled={pending}
      aria-label="Number"
      className={cn(FA_INPUT, 'h-8 w-[84px] px-2 py-1 text-[13px]')}
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
      <CabinetSectionHead
        title="Entry ledger"
        lede={
          <>
            Who entered {showName}, what they bought, what they entered, and what still needs
            attention. Reads the same entries and payments used everywhere else — edits here correct
            the entry/bridle/back number only.
          </>
        }
        actions={
          <Link
            href={`/dashboard/documents/print-center?show=${linkId}`}
            prefetch={false}
            className={FA_BTN}
          >
            <PrinterIcon className="size-4" aria-hidden />
            Print Center
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No entries yet"
          note="Rows appear here as riders check out, or when entries are added by hand."
        />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <caption className="sr-only">Entry ledger for {showName}</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Entry #
                </th>
                <th scope="col" className={FA_TH}>
                  Bridle #
                </th>
                <th scope="col" className={FA_TH}>
                  Back #
                </th>
                <th scope="col" className={FA_TH}>
                  Rider
                </th>
                <th scope="col" className={FA_TH}>
                  Horse
                </th>
                <th scope="col" className={FA_TH}>
                  Classes
                </th>
                <th scope="col" className={FA_TH}>
                  Status
                </th>
                <th scope="col" className={FA_TH}>
                  Fees
                </th>
                <th scope="col" className={FA_TH}>
                  Paid
                </th>
                <th scope="col" className={FA_TH}>
                  Balance
                </th>
                <th scope="col" className={FA_TH}>
                  Documents
                </th>
                <th scope="col" className={FA_TH}>
                  Issues
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.showEntryId}
                  className={cn(FA_TR, 'cursor-pointer hover:bg-[#FBFCFB]')}
                  onClick={() => {
                    setOpenEntryId(row.showEntryId);
                  }}
                >
                  <td
                    className={FA_TD}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <NumberCell
                      value={row.entryNumber}
                      pending={updateEntryNumber.isPending}
                      onSave={(next) => {
                        updateEntryNumber.mutate({
                          showId,
                          showEntryId: row.showEntryId,
                          entryNumber: next,
                        });
                      }}
                    />
                  </td>
                  <td
                    className={FA_TD}
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
                  </td>
                  <td
                    className={FA_TD}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <NumberCell
                        value={row.backNumber ?? ''}
                        pending={updateBackNumber.isPending}
                        onSave={(next) => {
                          updateBackNumber.mutate({
                            showId,
                            showEntryId: row.showEntryId,
                            backNumber: next,
                          });
                        }}
                      />
                      {row.backNumber && (
                        <BackNumberReprintButton showId={showId} showEntryId={row.showEntryId} />
                      )}
                    </div>
                  </td>
                  <td
                    className={cn(FA_TD, 'max-w-[160px] truncate font-bold')}
                    title={row.riderName}
                  >
                    {row.riderName}
                  </td>
                  <td className={cn(FA_TD, 'max-w-[140px] truncate')} title={row.horseName}>
                    {row.horseName}
                  </td>
                  <td
                    className={cn(FA_TD, 'max-w-[220px] truncate text-[12.5px]')}
                    title={row.classes.join(', ') || undefined}
                  >
                    {row.classes.join(', ') || '—'}
                  </td>
                  <td className={FA_TD}>
                    <Pill tone={STATUS_TONE[row.status] ?? 'grey'}>
                      {SHOW_ENTRY_STATUS_LABELS[row.status]}
                    </Pill>
                  </td>
                  <td className={FA_TD}>{formatMoney(row.fees)}</td>
                  <td className={FA_TD}>{formatMoney(row.amountPaid)}</td>
                  <td className={cn(FA_TD, row.balance > 0 && 'font-bold text-[#B4432F]')}>
                    {formatMoney(row.balance)}
                  </td>
                  <td className={FA_TD}>
                    <Pill tone={DOC_STATUS_TONE[row.documentStatus]}>
                      {DOC_STATUS_LABEL[row.documentStatus]}
                    </Pill>
                  </td>
                  <td
                    className={FA_TD}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {row.openIssueCount > 0 ? (
                      <Link
                        href={`/dashboard/documents/issues?show=${linkId}`}
                        prefetch={false}
                        className="font-bold text-[#B4432F] underline"
                      >
                        {row.openIssueCount}
                      </Link>
                    ) : (
                      <span className="text-[#5A6B63]">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
