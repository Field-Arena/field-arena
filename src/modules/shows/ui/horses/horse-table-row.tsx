'use client';

import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { truncateHorseName } from '@/modules/shows/utils/truncate-horse-name';
import { useRemindHorseDocuments } from '@/modules/shows/hooks/use-horses-mutations';
import type { HorseRow } from '@/modules/shows/data/horses-queries';
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
      className="grid items-start gap-3.5 border-b border-[#F1F4F3] px-5 py-3.5 transition-colors duration-100 hover:bg-[#F8FAF9]"
      style={{ gridTemplateColumns: HORSES_TABLE_TEMPLATE, minWidth: HORSES_TABLE_MIN_WIDTH }}
    >
      <div className="min-w-0">
        <div
          className="flex items-center gap-1.5 truncate text-[11.5px] text-[#7A8781] italic"
          title={row.isMultiEntry ? row.riders.join(', ') : undefined}
        >
          {row.riderLabel}
          {row.isMultiEntry && (
            <span className="inline-flex flex-none items-center rounded-full bg-[#E3EDFB] px-1.5 py-[1px] text-[10px] font-bold text-[#2E5FA8] not-italic">
              Multi-entry
            </span>
          )}
        </div>
        <div className="text-hunter-deep truncate text-[15px] font-extrabold" title={row.horseName}>
          🐴 {truncateHorseName(row.horseName)}
        </div>
      </div>

      <div>
        {row.isStallion ? (
          <span className="inline-block rounded-full bg-[#F7EFD3] px-2.5 py-1 text-[11px] font-bold text-[#7A5F0F]">
            Yes
          </span>
        ) : (
          <span className="text-[12.5px] text-[#98A29D]">No</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        {requirementsCount === 0 ? (
          <span className="text-[12.5px] text-[#98A29D]">None required</span>
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

      <div className="pt-0.5 text-center">
        {row.complete ? (
          <span className="text-status-success text-[26px] leading-none font-extrabold">✓</span>
        ) : (
          <span className="text-status-danger text-[26px] leading-none font-extrabold">✗</span>
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
              className="h-auto cursor-not-allowed rounded-[10px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap text-[#0D2C23] opacity-50 hover:bg-transparent"
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
                'hover:border-gold h-auto rounded-[10px] border border-[#D9E1DD] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap text-[#0D2C23] transition-colors hover:bg-transparent',
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
