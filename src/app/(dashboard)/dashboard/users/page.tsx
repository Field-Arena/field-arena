import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listStaff } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ROLE_PERMISSION_DEFAULTS, type PermissionKey } from '@/shared/constants/permissions';

export const metadata: Metadata = { title: 'Users — Field & Arena' };

/**
 * Staff assigned to a show, and what each of them may do.
 *
 * The permissions column resolves the same way the database does: role defaults
 * first, then the legacy single-flag columns on top. It is a UX convenience —
 * the authority is has_show_permission() in Postgres, and if the two ever
 * disagree the database wins.
 *
 * Money and refund authority are called out separately because they default to
 * false for every role including Show Admin, and must be granted per person.
 * Showing a Show Admin as having "everything" would misrepresent that.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Users"
        description="Who is staffed on this show, and what they can do."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Staff are assigned per show." />
      </WorkspacePage>
    );
  }

  const staff = await listStaff(context.currentShow.id);
  const accepted = staff.filter((s) => s.accepted).length;

  return (
    <WorkspacePage
      title="Users"
      description="Who is staffed on this show, and what they can do."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Stat label="Staffed" value={staff.length} />
        <Stat label="Accepted" value={accepted} sub="have signed in" />
        <Stat label="Pending" value={staff.length - accepted} sub="invite not accepted" />
      </div>

      {staff.length === 0 ? (
        <EmptyPanel
          title="Nobody staffed yet"
          note="Judges, scribes, announcers and show staff are invited per show."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table>
            <caption className="sr-only">Staff assigned to this show</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Contact</th>
                <th scope="col">Can do</th>
                <th scope="col">Money</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id}>
                  <td>
                    <strong>{person.name}</strong>
                    {person.isSteward && (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                        Steward
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge tone="neutral">{person.role}</StatusBadge>
                  </td>
                  <td>
                    {person.email ?? '—'}
                    {person.phone && (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                        {person.phone}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{describePermissions(person.role, person.canScratchSkipDq)}</td>
                  <td>
                    {person.canViewMoney ? (
                      <StatusBadge tone="warn">Can view</StatusBadge>
                    ) : (
                      <span style={{ color: 'var(--fa-muted)', fontSize: 12.5 }}>Hidden</span>
                    )}
                  </td>
                  <td>
                    {person.accepted ? (
                      <StatusBadge tone="success">Accepted</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">Pending</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="doc-note">
        Permissions shown are the role defaults plus any per-person grant. The database is the
        authority — this column hides controls, it does not enforce them.
      </p>
    </WorkspacePage>
  );
}

/** Mirrors the resolver's merge order: role defaults, then the legacy flag column. */
function describePermissions(role: string, canScratchSkipDq: boolean): string {
  const defaults = ROLE_PERMISSION_DEFAULTS[role] ?? {};
  const granted = new Set<PermissionKey>();

  for (const [key, value] of Object.entries(defaults)) {
    if (value) granted.add(key as PermissionKey);
  }
  if (canScratchSkipDq) {
    granted.add('canScratch');
    granted.add('canSkip');
    granted.add('canEliminate');
  }

  if (granted.size === 0) return 'View only';

  const parts: string[] = [];
  if (granted.has('canEnterScores')) parts.push('score');
  if (granted.has('canScratch') || granted.has('canSkip') || granted.has('canEliminate')) {
    parts.push('scratch/skip/DQ');
  }
  if (granted.has('canEditShow')) parts.push('edit show');
  if (granted.has('canManageStaff')) parts.push('manage staff');
  if (granted.has('canManageVendors')) parts.push('vendors');
  if (granted.has('canApproveDocuments')) parts.push('approve docs');
  if (granted.has('canPublishShow')) parts.push('publish');

  return parts.join(', ');
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
