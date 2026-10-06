'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { truncateHorseName } from '@/modules/shows/utils/truncate-horse-name';
import { useRemindHorseDocuments } from '@/modules/shows/hooks/use-horses-mutations';
import type { HorseRow } from '@/modules/shows/types';
import {
  HORSES_TABLE_TEMPLATE,
  HORSES_TABLE_MIN_WIDTH,
} from '@/modules/shows/ui/horses/table-tokens';
import { HorseDocumentLine } from '@/modules/shows/ui/horses/horse-document-line';

export function HorseTableRow({
  row,
  showId,
  requirementsCount,
}: {
  row: HorseRow;
  showId: string;
  requirementsCount: number;
}) {
  const remind = useRemindHorseDocuments();

  const canRemind = requirementsCount > 0 && row.missingLabels.length > 0;
  const remindDisabledReason = !row.horseId
    ? 'No document record for this horse yet'
    : !row.riderEmail
      ? 'No email on file for this rider'
      : null;

  return (
    <div
      className="grid items-start gap-3.5 border-b border-[#EEF1F4] px-5 py-3.5 transition-colors duration-100 hover:bg-[#FBFCFD]"
      style={{ gridTemplateColumns: HORSES_TABLE_TEMPLATE, minWidth: HORSES_TABLE_MIN_WIDTH }}
    >
      <div className="min-w-0 pt-0.5">
        <div className="truncate text-[13.5px] font-semibold text-[#101828]" title={row.horseName}>
          {truncateHorseName(row.horseName)}
        </div>
      </div>

      <div
        className="flex min-w-0 flex-wrap items-center gap-1.5 pt-0.5 text-[13.5px] text-[#475467]"
        title={row.isMultiEntry ? row.riders.join(', ') : undefined}
      >
        <span className="truncate">{row.riderLabel}</span>
        {row.isMultiEntry && <span className="fa-badge fa-pass !text-[10px]">Multi-entry</span>}
      </div>

      <div>
        {row.isStallion ? (
          <span className="fa-badge fa-pending">Yes</span>
        ) : (
          <span className="text-[12.5px] text-[#8A94A3]">No</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        {requirementsCount === 0 ? (
          <span className="text-[12.5px] text-[#8A94A3]">None required</span>
        ) : (
          row.documents.map((doc) => (
            <HorseDocumentLine
              key={doc.requirementId}
              doc={doc}
              showId={showId}
              horseId={row.horseId}
            />
          ))
        )}
      </div>

      <div className="pt-0.5">
        {row.complete ? (
          <span className="fa-badge fa-live">
            <span className="fa-dot" />
            Complete
          </span>
        ) : (
          <span className="fa-badge fa-red">
            <span className="fa-dot" />
            Incomplete
          </span>
        )}
      </div>

      <div className="pt-0.5">
        {canRemind &&
          (remindDisabledReason ? (
            <Button
              type="button"
              variant="ghost"
              disabled
              title={remindDisabledReason}
              className="h-auto cursor-not-allowed rounded-[10px] border border-[#E7EAEE] bg-white px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-[#475467] opacity-50 hover:bg-transparent"
            >
              ✉ Remind
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={remind.isPending}
              onClick={() => {
                if (row.horseId) remind.mutate({ showId, horseId: row.horseId });
              }}
              className={cn(
                'h-auto rounded-[10px] border border-[#E7EAEE] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap text-[#101828] transition-colors hover:border-[#D6DBE1] hover:bg-transparent',
                remind.isPending && 'opacity-60',
              )}
            >
              {remind.isPending ? 'Sending…' : '✉ Remind'}
            </Button>
          ))}
      </div>
    </div>
  );
}
