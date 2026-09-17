import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import type { HorsesPageData } from '@/modules/shows/data/horses-queries';

export function HorsesReportScreen({ data }: { data: HorsesPageData }) {
  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <ScreenTitle className="mb-1.5">Horses — Height &amp; Farrier</ScreenTitle>
      <ScreenLede className="mb-5">
        Every horse entered in {data.showName}, with its height and farrier on file — for stall
        planning and quick reference on show day.
      </ScreenLede>

      {data.rows.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            No horses entered yet.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableCaption className="sr-only">
              Horse height and farrier for {data.showName}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Horse</TableHead>
                <TableHead scope="col">Rider(s)</TableHead>
                <TableHead scope="col">Height</TableHead>
                <TableHead scope="col">Farrier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-semibold">{row.horseName}</TableCell>
                  <TableCell>
                    {row.riders.length > 0 ? row.riders.join(', ') : row.riderLabel}
                  </TableCell>
                  <TableCell>{row.height ?? '—'}</TableCell>
                  <TableCell>{row.farrier ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
