import type { Metadata } from 'next';
import { listPendingInvites, listPlatformUsers } from '@/modules/superadmin/data/queries';
import { StatusBadge } from '@/shared/ui/status-badge';
import { StatTile } from '@/shared/ui/stat-tile';
import { formatTimestamp } from '@/shared/lib/format/date';

export const metadata: Metadata = {
  title: 'Users — SuperAdmin Console',
};

/**
 * Every platform account, plus invites that have not been accepted.
 *
 * The org column reads "platform-wide" for a null org_id, which is correct for
 * SuperAdmin but also for every per-show role. That is not missing data: only
 * Organizer is org-scoped. A Judge or Show Admin has org_id null by design, with
 * their authority coming from a staff_assignments row for one specific show — the
 * legacy code documented treating ShowAdmin as org-wide as a real authorization
 * bug, so a blank here is the correct state rather than an omission.
 */
export default async function PlatformUsersPage() {
  const [users, invites] = await Promise.all([listPlatformUsers(), listPendingInvites()]);

  const byRole = new Map<string, number>();
  for (const user of users) {
    const role = user.platform_role ?? 'unassigned';
    byRole.set(role, (byRole.get(role) ?? 0) + 1);
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mb-1 font-serif text-[32px] font-bold leading-tight text-hunter-deep">
          Users
        </h1>
        <p className="text-fa-muted text-[15px]">Every platform account and pending invite.</p>
      </div>

      <section aria-label="Account summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Accounts" value={users.length} sub="with a profile" />
          <StatTile label="Super admins" value={byRole.get('SuperAdmin') ?? 0} />
          <StatTile label="Organizers" value={byRole.get('Organizer') ?? 0} />
          <StatTile label="Pending invites" value={invites.length} sub="not yet accepted" />
        </div>
      </section>

      <section aria-label="Accounts" className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-hunter-deep">Accounts</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="sr-only">Platform accounts and their roles</caption>
            <thead>
              <tr className="bg-hunter-pale">
                {['Name', 'Email', 'Role', 'Scope', 'Created'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="text-fa-muted px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold text-hunter-deep">{user.name}</td>
                  <td className="text-fa-muted px-3 py-2.5">{user.email}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={user.platform_role === 'SuperAdmin' ? 'info' : 'neutral'}>
                      {user.platform_role ?? 'unassigned'}
                    </StatusBadge>
                  </td>
                  <td className="text-fa-muted px-3 py-2.5">
                    {user.org_id ? 'Organization' : 'Platform-wide / per-show'}
                  </td>
                  <td className="text-fa-muted px-3 py-2.5">{formatTimestamp(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Pending invites" className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-hunter-deep">
          Pending invites
          <span className="text-fa-muted ml-2 text-sm font-normal">{invites.length}</span>
        </h2>

        {invites.length === 0 ? (
          <p className="text-fa-muted rounded-xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm">
            No invites outstanding.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full border-collapse text-[13.5px]">
              <caption className="sr-only">Invites that have not been accepted</caption>
              <thead>
                <tr className="bg-hunter-pale">
                  {['Email', 'Role', 'Sent', 'Expires'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="text-fa-muted px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-semibold text-hunter-deep">
                      {invite.email}
                      {invite.name && (
                        <span className="text-fa-muted block text-xs font-normal">
                          {invite.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone="neutral">{invite.role}</StatusBadge>
                    </td>
                    <td className="text-fa-muted px-3 py-2.5">
                      {formatTimestamp(invite.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      {new Date(invite.expires_at) < new Date() ? (
                        <StatusBadge tone="danger">Expired</StatusBadge>
                      ) : (
                        <span className="text-fa-muted">{formatTimestamp(invite.expires_at)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
