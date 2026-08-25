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
import type { ShowDocument } from '@/modules/announcements/data/queries';

export function ShowDocumentsTable({ documents }: { documents: ShowDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptyPanel
        title="No documents shared yet"
        note="Documents the organizer attaches to this show in ShowManager appear here."
      />
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Table>
        <TableCaption className="sr-only">Show documents</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Name
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((d) => (
            <TableRow key={d.id} className="hover:bg-transparent">
              <TableCell className="px-0 py-2 whitespace-normal">{d.name}</TableCell>
              <TableCell className="px-0 py-2 text-right whitespace-normal">
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-btn dash-btn-outline"
                  >
                    View ↗
                  </a>
                ) : (
                  <span className="card-meta">Unavailable</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
