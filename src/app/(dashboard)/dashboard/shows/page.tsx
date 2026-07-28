import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listClasses, listDivisions } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import { formatDateShort } from '@/shared/lib/format/date';

export const metadata: Metadata = { title: 'ShowManager — Field & Arena' };

/**
 * ShowManager: the classes and divisions that make up a show.
 *
 * Award scope is surfaced per class because it changes how ribbons are decided —
 * 'class' ranks that class alone, while 'division' or 'group' pools it with every
 * other class sharing that value into one combined set of placings. An organizer
 * looking at a start list needs to know which they configured.
 */
export default async function ShowManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="ShowManager"
        description="Set up classes, divisions and scheduling for a show."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel
          title="No shows yet"
          note="Create a show to configure its classes and divisions."
        />
      </WorkspacePage>
    );
  }

  const [classes, divisions] = await Promise.all([
    listClasses(context.currentShow.id),
    listDivisions(context.currentShow.id),
  ]);

  const totalEntries = classes.reduce((sum, c) => sum + c.entryCount, 0);
  const scheduled = classes.filter((c) => c.date).length;

  return (
    <WorkspacePage
      title="ShowManager"
      description="Set up classes, divisions and scheduling for a show."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <Stat label="Classes" value={classes.length} />
        <Stat label="Divisions" value={divisions.length} />
        <Stat label="Entries" value={totalEntries} />
        <Stat label="Scheduled" value={scheduled} sub="have a date set" />
      </div>

      <h2 className="show-detail-title" style={{ marginTop: 22 }}>
        Divisions
      </h2>
      {divisions.length === 0 ? (
        <EmptyPanel title="No divisions" note="Divisions group classes for awards and entry." />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table>
            <caption className="sr-only">Divisions for this show</caption>
            <thead>
              <tr>
                <th scope="col">Division</th>
                <th scope="col" className="r">
                  Classes
                </th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                  </td>
                  <td className="r">{d.classCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        Classes
      </h2>
      {classes.length === 0 ? (
        <EmptyPanel title="No classes" note="Classes are what riders enter and judges score." />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table>
            <caption className="sr-only">Classes for this show</caption>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Division</th>
                <th scope="col" className="r">
                  Fee
                </th>
                <th scope="col" className="r">
                  Entries
                </th>
                <th scope="col">When</th>
                <th scope="col">Awards</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.displayName ?? c.label}</strong>
                    {c.displayName && (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                        scores as {c.label}
                      </span>
                    )}
                  </td>
                  <td>{c.division ?? '—'}</td>
                  <td className="r">{formatMoney(c.fee)}</td>
                  <td className="r">
                    <strong>{c.entryCount}</strong>
                  </td>
                  <td>
                    {c.date ? formatDateShort(c.date) : '—'}
                    {c.time && ` ${c.time}`}
                  </td>
                  <td>
                    {c.ribbonPlaces} places
                    {c.awardScope !== 'class' && (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                        pooled by {c.awardScope}
                      </span>
                    )}
                  </td>
                  <td>
                    {c.resultsPublished ? (
                      <StatusBadge tone="success">Published</StatusBadge>
                    ) : c.scoringOpen ? (
                      <StatusBadge tone="warn">Scoring open</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not started</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
