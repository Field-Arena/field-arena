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
          {movements.map((m) => (
            <TableRow
              key={m.num}
              className="border-t border-b-0 border-[#E9EDEB] hover:bg-transparent"
            >
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
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
