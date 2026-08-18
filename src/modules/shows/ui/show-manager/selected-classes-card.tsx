import { Card } from '@/shared/ui/organizer/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import { formatMoney } from '@/shared/lib/format/currency';
import { SM_CARD_PAD, SM_SECTION_HEAD } from '@/modules/shows/ui/show-manager/tokens';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';

/**
 * "Selected Classes" — what checking groups above has actually put on the show.
 *
 * Grouped by division, because that is the unit the picker works in: showing
 * eighteen individual test rows for three checked levels would bury the fact
 * that the organizer made three decisions, not eighteen.
 */
export function SelectedClassesCard({ data }: { data: SelectEventsData }) {
  const groups = new Map<string, { count: number; fee: number; location: string | null }>();
  for (const cls of data.classes) {
    const key = cls.division ?? 'Ungrouped';
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { count: 1, fee: cls.fee, location: cls.location });
  }

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Selected Classes</h2>

        {groups.size === 0 ? (
          <p className="text-[13px] text-[#98A29D] italic">
            Nothing selected yet — check a division under any test above and it lands here.
          </p>
        ) : (
          <Table className="min-w-[520px] border-collapse text-[13.5px]">
            <TableCaption className="sr-only">Classes selected for this show</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-[#E9EDEB] hover:bg-transparent">
                <TableHead
                  scope="col"
                  className="h-auto px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                >
                  Division
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-auto px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                >
                  Location
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-auto px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                >
                  Fee
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-auto px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                >
                  Classes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...groups].map(([division, info]) => (
                <TableRow key={division} className="border-b border-[#EEF2F0] hover:bg-transparent">
                  <TableCell className="px-2.5 py-2 whitespace-normal">
                    <strong>{division}</strong>
                  </TableCell>
                  <TableCell className="px-2.5 py-2 whitespace-normal">
                    {info.location ?? 'No location set'}
                  </TableCell>
                  <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                    {formatMoney(info.fee)}
                  </TableCell>
                  <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                    <strong>{info.count}</strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <SectionFooter
        currentTab="Select Events"
        showId={data.showId}
        blockedReason={
          groups.size === 0
            ? "You haven't selected any events yet — riders won't have anything to register for."
            : null
        }
      />
    </>
  );
}
