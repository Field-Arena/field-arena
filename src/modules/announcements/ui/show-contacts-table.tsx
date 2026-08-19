import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
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
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table>
        <caption className="sr-only">Show contacts</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Role</th>
            <th scope="col">Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.staffId}>
              <td>
                <strong>{c.name}</strong>
              </td>
              <td>{c.role === 'Show Admin' ? 'Show Secretary' : c.role}</td>
              <td>{c.phone ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
