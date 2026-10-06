import { Fragment } from 'react';
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
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE } from '@/modules/shows/ui/show-manager/tokens';
import type { SelectedClassOption } from '@/modules/shows/types';

export function SelectedClassesCard({ classes }: { classes: SelectedClassOption[] }) {
  const byDivision = new Map<string, SelectedClassOption[]>();
  for (const cls of classes) {
    const key = cls.division ?? 'No division set';
    const existing = byDivision.get(key);
    if (existing) existing.push(cls);
    else byDivision.set(key, [cls]);
  }
  const groups = [...byDivision.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const needingTest = classes.filter((c) => !c.hasTest).length;

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Selected Classes</h2>
      <p className={SM_NOTE}>
        Every class on this show, its division and fee, and whether it still needs a test typed in
        below.
        {classes.length > 0 &&
          (needingTest > 0
            ? ` ${String(needingTest)} of ${String(classes.length)} still ${needingTest === 1 ? 'needs' : 'need'} a test.`
            : ' All classes have a test assigned.')}
      </p>

      {classes.length === 0 ? (
        <p className="text-[13px] text-[#8A94A3] italic">
          Nothing selected yet — check a division under Select Events and it lands here.
        </p>
      ) : (
        <Table className="min-w-[560px] border-collapse text-[13.5px]">
          <TableCaption className="sr-only">Classes selected for this show</TableCaption>
          <TableHeader>
            <TableRow className="border-b border-[#E7EAEE] hover:bg-transparent">
              <TableHead
                scope="col"
                className="h-auto px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#8A94A3] uppercase"
              >
                Class
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#8A94A3] uppercase"
              >
                Location
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#8A94A3] uppercase"
              >
                Fee
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#8A94A3] uppercase"
              >
                Test
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(([division, rows]) => (
              <Fragment key={division}>
                <TableRow className="border-b border-[#EEF1F4] hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="bg-[var(--fa-surface-2)] px-2.5 py-2 text-[11px] font-bold tracking-[.07em] text-[var(--fa-ink-2)] uppercase"
                  >
                    {division}
                  </TableCell>
                </TableRow>
                {rows.map((cls) => (
                  <TableRow key={cls.id} className="border-b border-[#EEF1F4] hover:bg-transparent">
                    <TableCell className="px-2.5 py-2.5 font-semibold whitespace-normal text-[#101828]">
                      {cls.label}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 whitespace-normal">
                      {cls.location ?? <span className="text-[#8A94A3]">No location set</span>}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                      {formatMoney(cls.fee)}
                    </TableCell>
                    <TableCell className="px-2.5 py-2 text-right whitespace-normal">
                      {cls.hasTest ? (
                        <span className="fa-badge fa-live">
                          <span className="fa-dot" />
                          Assigned
                        </span>
                      ) : (
                        <span className="fa-badge fa-red">
                          <span className="fa-dot" />
                          Needs a test
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
