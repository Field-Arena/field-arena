import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import type { ShowContact } from '@/modules/announcements/data/queries';

const ROLE_TONE: Record<string, PillTone> = {
  Judge: 'green',
  Scribe: 'blue',
  'Show Admin': 'purple',
};

export function ShowContactsTable({ contacts }: { contacts: ShowContact[] }) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts yet"
        note="Judges, scribes, and a show admin appear here once an organizer staffs them on this show."
      />
    );
  }

  return (
    <div className={FA_TABLE_WRAP}>
      <table className={FA_TABLE}>
        <caption className="sr-only">Show contacts</caption>
        <thead>
          <tr className={FA_THEAD_ROW}>
            <th scope="col" className={FA_TH}>
              Name
            </th>
            <th scope="col" className={FA_TH}>
              Role
            </th>
            <th scope="col" className={FA_TH}>
              Phone
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.staffId} className={FA_TR}>
              <td className={cn(FA_TD, 'font-bold text-[#0D2C23]')}>{c.name}</td>
              <td className={FA_TD}>
                <Pill tone={ROLE_TONE[c.role] ?? 'grey'}>
                  {c.role === 'Show Admin' ? 'Show Secretary' : c.role}
                </Pill>
              </td>
              <td className={FA_TD}>{c.phone ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
