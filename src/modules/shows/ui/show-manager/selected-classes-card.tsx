import { Card } from '@/shared/ui/organizer/card';
import { formatMoney } from '@/shared/lib/format/currency';
import { SM_CARD_PAD, SM_SECTION_HEAD } from './tokens';
import { SectionFooter } from './section-footer';
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
          <p className="text-[13px] text-[#98A29D] italic">
            Nothing selected yet — check a division under any test above and it lands here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
              <caption className="sr-only">Classes selected for this show</caption>
              <thead>
                <tr className="border-b border-[#E9EDEB]">
                  <th
                    scope="col"
                    className="px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                  >
                    Division
                  </th>
                  <th
                    scope="col"
                    className="px-2.5 py-2 text-left text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                  >
                    Fee
                  </th>
                  <th
                    scope="col"
                    className="px-2.5 py-2 text-right text-[11px] font-bold tracking-[.06em] text-[#6E7C76] uppercase"
                  >
                    Classes
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...groups].map(([division, info]) => (
                  <tr key={division} className="border-b border-[#EEF2F0]">
                    <td className="px-2.5 py-2">
                      <strong>{division}</strong>
                    </td>
                    <td className="px-2.5 py-2">{info.location ?? 'No location set'}</td>
                    <td className="px-2.5 py-2 text-right">{formatMoney(info.fee)}</td>
                    <td className="px-2.5 py-2 text-right">
                      <strong>{info.count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SectionFooter
        currentTab="Select Events"
        showId={data.showId}
        blockedReason={
          groups.size === 0
            ? "You haven't selected any events yet — riders won't have anything to register for."
            : null
        }
      />
    </>
  );
}
