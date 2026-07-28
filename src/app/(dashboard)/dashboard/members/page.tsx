import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { listMembers } from '@/modules/organizations/data/queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatDateShort, isPast } from '@/shared/lib/format/date';

export const metadata: Metadata = { title: 'Member Database — Field & Arena' };

/**
 * The organization's member database.
 *
 * Org-scoped rather than show-scoped, so it has no show picker: a member's
 * standing predates any show they appear on, which is why membership status and
 * expiry live here rather than on a per-show staff row.
 */
export default async function MembersPage() {
  const context = await getOrganizerContext();
  const members = context.orgId ? await listMembers(context.orgId) : [];

  const active = members.filter((m) => m.membershipStatus === 'active').length;
  const expired = members.filter((m) => isPast(m.membershipExpires)).length;

  return (
    <WorkspacePage
      title="Member Database"
      description="Everyone your organization tracks, independent of any one show."
      orgName={context.orgName}
      showPicker={false}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Stat label="Members" value={members.length} />
        <Stat label="Active" value={active} />
        <Stat label="Expired" value={expired} sub="membership lapsed" />
      </div>

      {members.length === 0 ? (
        <EmptyPanel
          title="No members yet"
          note="Members are added here or imported from a CSV. Nothing is recorded for this organization."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table>
            <caption className="sr-only">Organization members</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Contact</th>
                <th scope="col">Status</th>
                <th scope="col">Expires</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>{member.role ?? '—'}</td>
                  <td>
                    {member.email ?? '—'}
                    {member.phone && (
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fa-muted)' }}>
                        {member.phone}
                      </span>
                    )}
                  </td>
                  <td>
                    {member.membershipStatus === 'active' ? (
                      <StatusBadge tone="success">Active</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    )}
                  </td>
                  <td>
                    {member.membershipExpires ? (
                      isPast(member.membershipExpires) ? (
                        <StatusBadge tone="danger">
                          Expired {formatDateShort(member.membershipExpires)}
                        </StatusBadge>
                      ) : (
                        formatDateShort(member.membershipExpires)
                      )
                    ) : (
                      '—'
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
