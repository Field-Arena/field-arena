'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/dialog';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import { SHOW_ENTRY_STATUS_LABELS } from '@/modules/shows/constants';
import type { EntryLedgerRow } from '@/modules/shows/data/entry-ledger-queries';

const STATUS_TONE: Record<string, StatusTone> = {
  submitted: 'neutral',
  documents_received: 'info',
  documents_verified: 'info',
  checkin_released: 'warn',
  cleared: 'success',
  scratched: 'danger',
};

const DOC_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  replacement_requested: 'Replacement requested',
};

const DOC_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  replacement_requested: 'warn',
};

export function EntryDetailDialog({
  row,
  onClose,
}: {
  row: EntryLedgerRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={row !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {row && (
        <DialogContent className="max-h-[85vh] max-w-[560px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Entry #{row.entryNumber} — {row.riderName}
            </DialogTitle>
            <DialogDescription>
              Bridle #{row.bridleNumber}
              {row.backNumber ? ` · Back #${row.backNumber}` : ''} · {row.horseName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONE[row.status] ?? 'neutral'}>
                {SHOW_ENTRY_STATUS_LABELS[row.status]}
              </StatusBadge>
              <span className="text-[#7A8781]">
                {formatMoney(row.fees)} fees · {formatMoney(row.amountPaid)} paid ·{' '}
                <span className={row.balance > 0 ? 'text-status-danger font-semibold' : ''}>
                  {formatMoney(row.balance)} balance
                </span>
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase">
                Classes
              </h3>
              {row.classLines.length === 0 ? (
                <p className="text-[#98A29D] italic">No classes on this entry.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {row.classLines.map((line) => (
                    <li key={line.classId} className="flex items-center justify-between gap-3">
                      <span>{line.classLabel}</span>
                      <span className="font-semibold">{formatMoney(line.fee)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase">
                Documents
              </h3>
              {row.documents.length === 0 ? (
                <p className="text-[#98A29D] italic">No document requirements for this horse.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {row.documents.map((doc) => (
                    <li key={doc.requirementId} className="flex items-center justify-between gap-3">
                      <span>{doc.label}</span>
                      <StatusBadge tone={DOC_STATUS_TONE[doc.status] ?? 'neutral'}>
                        {DOC_STATUS_LABEL[doc.status] ?? doc.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase">
                Open issues
              </h3>
              {row.issues.length === 0 ? (
                <p className="text-[#98A29D] italic">Nothing outstanding.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {row.issues.map((issue) => (
                    <li key={issue.id} className="rounded-md bg-[#FFF5F5] p-2.5">
                      <div className="font-semibold text-[#B3261E] capitalize">{issue.kind}</div>
                      <div>{issue.message}</div>
                      {issue.detail && <div className="mt-0.5 text-[#7A8781]">{issue.detail}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
