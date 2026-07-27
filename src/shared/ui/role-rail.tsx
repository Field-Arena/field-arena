'use client';

import Link from 'next/link';
import {
  ShieldIcon,
  LayoutGridIcon,
  BriefcaseIcon,
  UsersIcon,
  SquareCheckIcon,
  FlagIcon,
  Volume2Icon,
  TagIcon,
} from 'lucide-react';
import { ROLE_RAIL_ORDER, ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { cn } from '@/shared/lib/utils';

/**
 * The dark role rail down the left edge.
 *
 * Lives in shared/ui because both the SuperAdmin console and the organizer
 * workspace render it, and a module may not import another module's internals.
 *
 * Interactive for SuperAdmin only. In the legacy app this rail came from
 * platform.html — the demo shell built to showcase every role — so every icon was
 * clickable there. Carrying that behaviour into the real app would be a
 * privilege-escalation control: a Judge could click straight into the SuperAdmin
 * console. SuperAdmin keeps it because api/_lib/authz.js documents their reach as
 * "a real support/impersonation capability, not a bug".
 */
const ICONS: Record<string, typeof ShieldIcon> = {
  SuperAdmin: ShieldIcon,
  Organizer: LayoutGridIcon,
  ShowAdmin: BriefcaseIcon,
  ShowStaff: UsersIcon,
  Judge: SquareCheckIcon,
  Scribe: FlagIcon,
  Announcer: Volume2Icon,
  Vendor: TagIcon,
};

export function RoleRail({ currentRole }: { currentRole: string | null }) {
  const isSuperAdmin = currentRole === 'SuperAdmin';
  const roles = isSuperAdmin
    ? ROLE_RAIL_ORDER.filter((role) => role in ROLE_WORKSPACES)
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
        const target = ROLE_WORKSPACES[role];
        if (!target) return null;
        const Icon = ICONS[role] ?? LayoutGridIcon;
        const active = role === currentRole;
        const label =
          target.status === 'pending' ? `${target.title} — not migrated yet` : target.title;

        const classes = cn(
          'grid size-10 place-items-center rounded-[11px] transition',
          active ? 'bg-gold text-hunter-deep' : 'text-[#8ba093] hover:bg-white/10 hover:text-[#d7e2da]'
        );

        // Nowhere to navigate when the rail shows only the viewer's own role, so
        // it renders as an indicator rather than a link back to the current page.
        if (!isSuperAdmin) {
          return (
            <span key={role} className={classes} title={target.title} aria-label={target.title}>
              <Icon className="size-5" aria-hidden />
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
            <Icon className="size-5" aria-hidden />
          </Link>
        );
      })}
    </aside>
  );
}
