import Link from 'next/link';
import { Card } from '@/shared/ui/organizer/card';
import { formatMoney } from '@/shared/lib/format/currency';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_GREEN_BTN } from './tokens';
import type { SelectEventsData } from '../../data/setup-queries';

/**
 * "Selected Classes" — what checking groups above has actually put on the show.
 *
 * Grouped by division, because that is the unit the picker works in: showing
 * eighteen individual test rows for three checked levels would bury the fact
 * that the organizer made three decisions, not eighteen.
 */
export function SelectedClassesCard({ data }: { data: SelectEventsData }) {
  const groups = new Map<string, { count: number; fee: number; location: string | null }>();
  for (const cls of data.classes) {
    const key = cls.division ?? 'Ungrouped';
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { count: 1, fee: cls.fee, location: cls.location });
  }

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <h2 className={SM_SECTION_HEAD}>Selected Classes</h2>

        {groups.size === 0 ? (
          <p className="text-[13px] italic text-[#98A29D]">
            Nothing selected yet — check a division under any test above and it lands here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <caption className="sr-only">Classes selected for this show</caption>
              <thead>
                <tr>
                  <th scope="col">Division</th>
                  <th scope="col">Location</th>
                  <th scope="col" className="r">
                    Fee
                  </th>
                  <th scope="col" className="r">
                    Classes
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...groups].map(([division, info]) => (
                  <tr key={division}>
                    <td>
                      <strong>{division}</strong>
                    </td>
                    <td>{info.location ?? 'No location set'}</td>
                    <td className="r">{formatMoney(info.fee)}</td>
                    <td className="r">
                      <strong>{info.count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[#EDF0EE] bg-white px-6 py-5">
        <p className="min-w-0 text-[13px] text-[#6E7C76]">
          Next: set up add-ons, vendor spaces, and qualifications for riders to purchase.
        </p>
        <Link
          href={`/dashboard/shows/${data.showId}/rider-entries`}
          className={`${SM_GREEN_BTN} ml-auto`}
        >
          Continue to Rider Entries →
        </Link>
      </div>
    </>
  );
}
