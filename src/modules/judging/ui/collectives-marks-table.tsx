import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { Card } from '@/shared/ui/organizer/card';

export interface ScorecardCollective {
  key: string;
  label: string;
  coef: number;
}

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
          <TableRow className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase hover:bg-transparent">
            <TableHead className="h-auto p-2">Category</TableHead>
            <TableHead className="h-auto p-2">Coef</TableHead>
            <TableHead className="h-auto p-2 text-right">Mark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collectives.map((c) => (
            <TableRow
              key={c.key}
              className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent"
            >
              <TableCell className="p-2 whitespace-normal">{c.label}</TableCell>
              <TableCell className="p-2 whitespace-normal">{c.coef}</TableCell>
              <TableCell className="text-ink-deep p-2 text-right font-mono font-semibold whitespace-normal">
                {marks[c.key] ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
