import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import type { ResultRow } from '@/modules/announcements/data/queries';

export function LiveResultsTable({ results }: { results: ResultRow[] }) {
  if (results.length === 0) {
    return (
      <EmptyPanel
        title="No scored rides yet"
        note="A rider appears here the moment their score is confirmed — before the organizer publishes standings for the class."
      />
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Table>
        <TableCaption className="sr-only">Live results</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Class
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-right">
              Place
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Rider
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Horse
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-right">
              Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((row) => (
            <TableRow key={`${row.classLabel}-${row.num}`} className="hover:bg-transparent">
              <TableCell className="px-0 py-2 whitespace-normal">{row.classLabel}</TableCell>
              <TableCell className="px-0 py-2 text-right whitespace-normal">
                <strong>{row.place}</strong>
              </TableCell>
              <TableCell className="px-0 py-2 whitespace-normal">
                #{row.num} {row.rider ?? '—'}
              </TableCell>
              <TableCell className="px-0 py-2 whitespace-normal">{row.horse ?? '—'}</TableCell>
              <TableCell className="px-0 py-2 text-right whitespace-normal">
                <span className="pct">{row.finalPct ?? '—'}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
