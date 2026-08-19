import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { Card } from '@/shared/ui/organizer/card';

export interface ScorecardCollective {
  key: string;
  label: string;
  coef: number;
}

/** The collective-marks table on the History drill-down's scorecard. */
export function CollectivesMarksTable({
  collectives,
  marks,
}: {
  collectives: ScorecardCollective[];
  marks: Record<string, number | null>;
}) {
  return (
    <Card className="overflow-x-auto p-[16px_18px]">
      <Table className="min-w-[320px] border-collapse text-[13.5px]">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="hover:bg-transparent text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
            <TableHead className="h-auto p-2">Category</TableHead>
            <TableHead className="h-auto p-2">Coef</TableHead>
            <TableHead className="h-auto p-2 text-right">Mark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collectives.map((c) => (
            <TableRow key={c.key} className="hover:bg-transparent border-t border-b-0 border-[#E9EDEB]">
              <TableCell className="whitespace-normal p-2">{c.label}</TableCell>
              <TableCell className="whitespace-normal p-2">{c.coef}</TableCell>
              <TableCell className="whitespace-normal p-2 text-right font-mono font-semibold text-ink-deep">
                {marks[c.key] ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
