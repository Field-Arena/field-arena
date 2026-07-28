'use client';

import Link from 'next/link';
import { RIDER_WORKSPACE, ROLE_RAIL_ORDER, ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { RoleIcon } from '@/shared/ui/role-icon';
import { cn } from '@/shared/lib/utils';

/**
 * The dark role rail down the left edge, used by the SuperAdmin console.
 *
 * Icons are the verbatim legacy glyphs (see RoleIcon), in the legacy order,
 * including Rider — which is on the rail despite not being a platform_role, so
 * it resolves against RIDER_WORKSPACE.
 *
 * Interactive for SuperAdmin only. In the legacy app the rail lived in
 * platform.html — the demo shell built to showcase every role — so every icon
 * was clickable. Carrying that into the real app would be a
 * privilege-escalation control: a Judge could click into the SuperAdmin console.
 * SuperAdmin keeps it because api/_lib/authz.js documents their reach as "a real
 * support/impersonation capability, not a bug".
 */
export function RoleRail({ currentRole }: { currentRole: string | null }) {
  const isSuperAdmin = currentRole === 'SuperAdmin';

  const workspaceFor = (role: string) =>
    role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];

  const roles = isSuperAdmin
    ? ROLE_RAIL_ORDER.filter((role) => workspaceFor(role) !== undefined)
    : ROLE_RAIL_ORDER.filter((role) => role === currentRole);

  return (
    <aside className="flex w-[54px] flex-none flex-col items-center gap-1.5 bg-hunter-deep py-3.5">
      <div className="font-serif text-sm font-bold leading-none text-white">
        F<span className="text-gold">&amp;</span>A
      </div>
      <div className="mb-3 text-[8px] tracking-[0.12em] text-[#7f8f84]">
        {isSuperAdmin ? 'ROLES' : 'ROLE'}
      </div>

      {roles.map((role) => {
        const target = workspaceFor(role);
        if (!target) return null;
        const active = role === currentRole;
        const label =
          target.status === 'pending' ? `${target.title} — not migrated yet` : target.title;

        const classes = cn(
          'grid size-10 place-items-center rounded-[11px] transition',
          active
            ? 'bg-gold text-hunter-deep'
            : 'text-[#8ba093] hover:bg-white/10 hover:text-[#d7e2da]'
        );

        if (!isSuperAdmin) {
          return (
            <span key={role} className={classes} title={target.title} aria-label={target.title}>
              <RoleIcon role={role} size={20} />
            </span>
          );
        }

        return (
          <Link
            key={role}
            href={target.href}
            className={classes}
            title={label}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <RoleIcon role={role} size={20} />
          </Link>
        );
      })}
    </aside>
  );
}
