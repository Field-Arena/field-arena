import { Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { Card } from '@/shared/ui/organizer/card';

export interface ScorecardMovement {
  num: number;
  text: string;
  coef: number;
  section?: string;
}

interface SectionGroup {
  section: string;
  items: ScorecardMovement[];
}

/** Group movements by their `section`, preserving first-appearance order.
 *  Returns null when none carry a section (legacy flat tests render unchanged). */
function groupBySection(movements: ScorecardMovement[]): SectionGroup[] | null {
  if (!movements.some((m) => m.section)) return null;
  const groups: SectionGroup[] = [];
  const indexBySection = new Map<string, number>();
  for (const m of movements) {
    const section = m.section ?? '';
    const existing = indexBySection.get(section);
    if (existing === undefined) {
      indexBySection.set(section, groups.length);
      groups.push({ section, items: [m] });
    } else {
      groups[existing]?.items.push(m);
    }
  }
  return groups;
}

function sectionSubtotal(items: ScorecardMovement[], marks: Record<string, number | null>): number {
  return items.reduce((sum, m) => sum + (marks[String(m.num)] ?? 0) * m.coef, 0);
}

function sectionMax(items: ScorecardMovement[]): number {
  return items.reduce((sum, m) => sum + 10 * m.coef, 0);
}

export function MovementsMarksTable({
  movements,
  marks,
  remarks,
}: {
  movements: ScorecardMovement[];
  marks: Record<string, number | null>;
  remarks: Record<string, string>;
}) {
  const groups = groupBySection(movements);

  const movementRow = (m: ScorecardMovement) => (
    <TableRow key={m.num} className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
      <TableCell className="p-2 whitespace-normal">{m.num}</TableCell>
      <TableCell className="p-2 whitespace-normal">{m.text}</TableCell>
      <TableCell className="p-2 whitespace-normal">{m.coef}</TableCell>
      <TableCell className="text-ink-deep p-2 text-right font-mono font-semibold whitespace-normal">
        {marks[String(m.num)] ?? '—'}
      </TableCell>
      <TableCell className="p-2 whitespace-normal text-[#5A6B63]">
        {remarks[String(m.num)] ?? ''}
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="overflow-x-auto p-[16px_18px]">
      <Table className="min-w-[480px] border-collapse text-[13.5px]">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
            <TableHead className="h-auto p-2">#</TableHead>
            <TableHead className="h-auto p-2">Movement</TableHead>
            <TableHead className="h-auto p-2">Coef</TableHead>
            <TableHead className="h-auto p-2 text-right">Mark</TableHead>
            <TableHead className="h-auto p-2">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups
            ? groups.map((group) => (
                <Fragment key={group.section}>
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="p-2 pt-3 text-[11px] font-semibold tracking-[.08em] text-[#7A8781] uppercase"
                    >
                      {group.section}
                    </TableCell>
                  </TableRow>
                  {group.items.map(movementRow)}
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="p-2 text-right text-[12px] font-semibold text-[#7A8781]"
                    >
                      Section subtotal
                    </TableCell>
                    <TableCell className="p-2 text-right font-mono font-semibold text-[#7A8781]">
                      {sectionSubtotal(group.items, marks)} / {sectionMax(group.items)}
                    </TableCell>
                    <TableCell className="p-2" />
                  </TableRow>
                </Fragment>
              ))
            : movements.map(movementRow)}
        </TableBody>
      </Table>
    </Card>
  );
}
