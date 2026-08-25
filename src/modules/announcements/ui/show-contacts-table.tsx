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
import type { ShowContact } from '@/modules/announcements/data/queries';

export function ShowContactsTable({ contacts }: { contacts: ShowContact[] }) {
  if (contacts.length === 0) {
    return (
      <EmptyPanel
        title="No contacts yet"
        note="Judges, scribes, and a show admin appear here once an organizer staffs them on this show."
      />
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Table>
        <TableCaption className="sr-only">Show contacts</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Name
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Role
            </TableHead>
            <TableHead scope="col" className="h-auto px-0 py-2 text-left">
              Phone
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.staffId} className="hover:bg-transparent">
              <TableCell className="px-0 py-2 whitespace-normal">
                <strong>{c.name}</strong>
              </TableCell>
              <TableCell className="px-0 py-2 whitespace-normal">
                {c.role === 'Show Admin' ? 'Show Secretary' : c.role}
              </TableCell>
              <TableCell className="px-0 py-2 whitespace-normal">{c.phone ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
