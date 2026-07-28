import type { Metadata } from 'next';
import { listMyAssignments } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'My Assignments — Field & Arena' };

/**
 * The Judge and Scribe workspace, ported from judge-scribe.html's
 * "My Assignments" panel.
 *
 * Not scoped to one show, unlike the organizer pages. An official works across
 * organizations and needs one list of everything they are booked on, which is
 * what that panel gave them.
 */
export default async function JudgingPage() {
  const [profile, assignments] = await Promise.all([getStaffProfile(), listMyAssignments()]);
  const roleLabel = profile?.platform_role ?? 'Official';

  const open = assignments.filter((a) => a.scoringOpen).length;
  const done = assignments.filter((a) => a.resultsPublished).length;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>My Assignments</h1>
          <p>Every class you are on a panel for, across all shows.</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <div className="stat">
            <div className="stat-label">Classes</div>
            <div className="stat-value">{assignments.length}</div>
            <div className="stat-sub">you are panelled on</div>
          </div>
          <div className="stat">
            <div className="stat-label">Scoring open</div>
            <div className="stat-value">{open}</div>
            <div className="stat-sub">accepting marks now</div>
          </div>
          <div className="stat">
            <div className="stat-label">Published</div>
            <div className="stat-value">{done}</div>
            <div className="stat-sub">results final</div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <EmptyPanel
            title="No assignments yet"
            note={`You are not on any class panel. An organizer assigns a ${roleLabel.toLowerCase()} to a class from ShowManager, and it appears here once they do.`}
          />
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table>
              <caption className="sr-only">Classes you are on a panel for</caption>
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Show</th>
                  <th scope="col">Seat</th>
                  <th scope="col">Your role</th>
                  <th scope="col" className="r">
                    Rides
                  </th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={`${a.classId}-${a.seatId}`}>
                    <td>
                      <strong>{a.classLabel}</strong>
                    </td>
                    <td>
                      {a.showName}
                      {a.showDate && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                          {a.showDate}
                        </span>
                      )}
                    </td>
                    <td>
                      {a.seatId}
                      {a.position && ` · ${a.position}`}
                    </td>
                    <td>
                      <StatusBadge tone={a.seatRole === 'judge' ? 'info' : 'neutral'}>
                        {a.seatRole === 'judge' ? 'Judge' : 'Scribe'}
                      </StatusBadge>
                    </td>
                    <td className="r">
                      <strong>{a.entryCount}</strong>
                      {a.scoredCount > 0 && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                          {a.scoredCount} scored
                        </span>
                      )}
                    </td>
                    <td>
                      {a.resultsPublished ? (
                        <StatusBadge tone="success">Published</StatusBadge>
                      ) : a.scoringOpen ? (
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

        <p className="doc-note">
          Entering marks needs the live scoring screen, which is not migrated yet. This page shows
          what you are booked on and how far each class has got.
        </p>
      </div>
    </>
  );
}
