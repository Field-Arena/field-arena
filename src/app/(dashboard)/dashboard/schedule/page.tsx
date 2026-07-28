import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listClasses } from '@/modules/shows/data/setup-queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatDateShort } from '@/shared/lib/format/date';

export const metadata: Metadata = { title: 'Master Schedule — Field & Arena' };

/**
 * The master schedule for the focused show.
 *
 * Classes are grouped by day and ordered by time. Anything without a date is
 * listed separately as unscheduled rather than dropped or bucketed under an
 * arbitrary day — an unscheduled class is a real state during setup, and hiding
 * it is how a class ends up missing from the printed schedule.
 */
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Master Schedule"
        description="Every class, by day and ring."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="The schedule is built per show." />
      </WorkspacePage>
    );
  }

  const supabase = await createServerClient();
  const [classes, { data: show }] = await Promise.all([
    listClasses(context.currentShow.id),
    supabase
      .from('shows')
      .select('day_start_times, day_end_times, locations, runner_state')
      .eq('id', context.currentShow.id)
      .single(),
  ]);

  const scheduled = classes.filter((c) => c.date);
  const unscheduled = classes.filter((c) => !c.date);

  // Group by day, each day's classes ordered by time then label.
  const days = new Map<string, typeof classes>();
  for (const cls of scheduled) {
    const key = cls.date ?? '';
    const list = days.get(key) ?? [];
    list.push(cls);
    days.set(key, list);
  }
  const orderedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [, list] of orderedDays) {
    list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.label.localeCompare(b.label));
  }

  const runner = (show?.runner_state ?? {}) as { approved?: boolean };
  const rings = Array.isArray(show?.locations) ? show.locations.length : 0;

  return (
    <WorkspacePage
      title="Master Schedule"
      description="Every class, by day and ring."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <Stat label="Classes" value={classes.length} />
        <Stat label="Scheduled" value={scheduled.length} sub="have a date" />
        <Stat label="Show days" value={orderedDays.length} />
        <Stat label="Rings" value={rings} sub="configured" />
      </div>

      <p className="doc-note">
        {runner.approved
          ? 'This schedule has been approved. Riders and officials see it as final.'
          : 'This schedule is not approved yet, so it is still a draft as far as riders and officials are concerned.'}
      </p>

      {orderedDays.length === 0 ? (
        <EmptyPanel
          title="Nothing scheduled"
          note="No class has a date set yet. Assign dates in Show Manager and they appear here grouped by day."
        />
      ) : (
        orderedDays.map(([date, list]) => (
          <div key={date} style={{ marginTop: 20 }}>
            <h2 className="show-detail-title">{formatDateShort(date)}</h2>
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table>
                <caption className="sr-only">Classes on {formatDateShort(date)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Class</th>
                    <th scope="col">Division</th>
                    <th scope="col" className="r">
                      Rides
                    </th>
                    <th scope="col">State</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        {/* time is '' for an unset time, not null, so an empty
                            string has to fall through to the dash. */}
                        <strong>{cls.time === '' ? '—' : (cls.time ?? '—')}</strong>
                      </td>
                      <td>{cls.displayName ?? cls.label}</td>
                      <td>{cls.division ?? '—'}</td>
                      <td className="r">{cls.entryCount}</td>
                      <td>
                        {cls.resultsPublished ? (
                          <StatusBadge tone="success">Published</StatusBadge>
                        ) : cls.scoringOpen ? (
                          <StatusBadge tone="warn">Live</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Not started</StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {unscheduled.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 className="show-detail-title">Not yet scheduled</h2>
          <p className="show-detail-meta">
            {unscheduled.length} class{unscheduled.length === 1 ? '' : 'es'} with no date. These will
            not appear on a printed schedule until a date is set.
          </p>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table>
              <caption className="sr-only">Classes with no date set</caption>
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Division</th>
                  <th scope="col" className="r">
                    Rides
                  </th>
                </tr>
              </thead>
              <tbody>
                {unscheduled.map((cls) => (
                  <tr key={cls.id}>
                    <td>
                      <strong>{cls.displayName ?? cls.label}</strong>
                    </td>
                    <td>{cls.division ?? '—'}</td>
                    <td className="r">{cls.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </WorkspacePage>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
