import { StatusBadge } from '@/shared/ui/status-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/shared/ui/shadcn/table';
import type { RingRow } from '@/modules/announcements/data/queries';

export function AllRingsTable({ rings }: { rings: RingRow[] }) {
  return (
    <>
      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        All rings
      </h2>
      <div style={{ marginTop: 10 }}>
        <Table>
          <TableCaption className="sr-only">Every class and its ring state</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="h-auto px-0 py-2 text-left">
                Class
              </TableHead>
              <TableHead scope="col" className="h-auto px-0 py-2 text-left">
                Ring
              </TableHead>
              <TableHead scope="col" className="h-auto px-0 py-2 text-right">
                Rides
              </TableHead>
              <TableHead scope="col" className="h-auto px-0 py-2 text-left">
                State
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rings.map((ring) => (
              <TableRow key={ring.classId} className="hover:bg-transparent">
                <TableCell className="px-0 py-2 whitespace-normal">
                  <strong>{ring.className}</strong>
                </TableCell>
                <TableCell className="px-0 py-2 whitespace-normal">{ring.ring ?? '—'}</TableCell>
                <TableCell className="px-0 py-2 text-right whitespace-normal">
                  {ring.entryCount}
                </TableCell>
                <TableCell className="px-0 py-2 whitespace-normal">
                  {ring.scoringOpen ? (
                    <StatusBadge tone="warn">Live</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not started</StatusBadge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
