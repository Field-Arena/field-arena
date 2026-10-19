import { Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { FA_TABLE_WRAP } from '@/shared/ui/organizer/fa-page';

export interface ScorecardCollective {
  key: string;
  label: string;
  coef: number;
  section?: string;
}

interface SectionGroup {
  section: string;
  items: ScorecardCollective[];
}

/** Group collective marks by their `section`, preserving first-appearance order.
 *  Returns null when none carry a section (legacy flat tests render unchanged). */
function groupBySection(collectives: ScorecardCollective[]): SectionGroup[] | null {
  if (!collectives.some((c) => c.section)) return null;
  const groups: SectionGroup[] = [];
  const indexBySection = new Map<string, number>();
  for (const c of collectives) {
    const section = c.section ?? '';
    const existing = indexBySection.get(section);
    if (existing === undefined) {
      indexBySection.set(section, groups.length);
      groups.push({ section, items: [c] });
    } else {
      groups[existing]?.items.push(c);
    }
  }
  return groups;
}

function sectionSubtotal(
  items: ScorecardCollective[],
  marks: Record<string, number | null>,
): number {
  return items.reduce((sum, c) => sum + (marks[c.key] ?? 0) * c.coef, 0);
}

function sectionMax(items: ScorecardCollective[]): number {
  return items.reduce((sum, c) => sum + 10 * c.coef, 0);
}

export function CollectivesMarksTable({
  collectives,
  marks,
}: {
  collectives: ScorecardCollective[];
  marks: Record<string, number | null>;
}) {
  const groups = groupBySection(collectives);

  const collectiveRow = (c: ScorecardCollective) => (
    <TableRow key={c.key} className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
      <TableCell className="px-3 py-2 whitespace-normal">{c.label}</TableCell>
      <TableCell className="px-3 py-2 whitespace-normal">{c.coef}</TableCell>
      <TableCell className="text-ink-deep px-3 py-2 text-right font-mono font-semibold whitespace-normal">
        {marks[c.key] ?? '—'}
      </TableCell>
    </TableRow>
  );

  return (
    <div className={FA_TABLE_WRAP}>
      <Table className="min-w-[320px] border-collapse text-[13.5px]">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="bg-[#F5F7F6] text-left text-[11px] tracking-[.06em] text-[#5A6B63] uppercase hover:bg-[#F5F7F6]">
            <TableHead className="h-auto px-3 py-2.5 font-bold">Category</TableHead>
            <TableHead className="h-auto px-3 py-2.5 font-bold">Coef</TableHead>
            <TableHead className="h-auto px-3 py-2.5 text-right font-bold">Mark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups
            ? groups.map((group) => (
                <Fragment key={group.section}>
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="px-3 py-2 pt-3 text-[11px] font-semibold tracking-[.08em] text-[#7A8781] uppercase"
                    >
                      {group.section}
                    </TableCell>
                  </TableRow>
                  {group.items.map(collectiveRow)}
                  <TableRow className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent">
                    <TableCell
                      colSpan={2}
                      className="px-3 py-2 text-right text-[12px] font-semibold text-[#7A8781]"
                    >
                      Section subtotal
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right font-mono font-semibold text-[#7A8781]">
                      {sectionSubtotal(group.items, marks)} / {sectionMax(group.items)}
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            : collectives.map(collectiveRow)}
        </TableBody>
      </Table>
    </div>
  );
}
