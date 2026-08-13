'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { StaffProfile } from '@/modules/auth/data/queries';
import { RoleRail } from '@/shared/ui/role-rail';
import { NavIcon } from '@/shared/ui/nav-icon';
import { Tip } from '@/shared/ui/tip';
import { cn } from '@/shared/lib/utils';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { ROLE_NAV } from '@/modules/staff/constants';
import { SUPERADMIN_SIDEBAR, SUPERADMIN_TOOLS } from '../constants';
import { OrganizerSearch } from './organizer-search';
import { AddOrganizerDialog } from './add-organizer-dialog';
import { ConsoleIcon } from './console-icon';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

/**
 * The SuperAdmin console shell, built to the Admin Console design: a narrow role
 * rail, a dark sidebar grouped Clients / Platform / Tools, and a sticky header
 * over the content.
 *
 * Its own shell rather than a reuse of the organizer one, because the two are
 * genuinely different shapes — this is platform-wide sections over wide tables,
 * the organizer workspace is a per-show sidebar.
 *
 * Rail and sidebar are desktop-only. The design is drawn at 1480px and both are
 * fixed-width columns; below lg they would eat most of a narrow screen, so they
 * collapse and the header carries the actions instead.
 */
export function SuperAdminShell({
  children,
  profile,
  activeRailRole,
}: {
  children: ReactNode;
  profile: StaffProfile;
  /** Which ROLES rail icon is highlighted — see shared/lib/rail-role.ts. */
  activeRailRole: string;
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const isOrganizerList = pathname === '/dashboard/superadmin';

  // The console's own pages live under /dashboard/superadmin; every other route
  // a SuperAdmin reaches here is a role-workspace PREVIEW opened from the ROLES
  // rail (Judge, Scribe, Announcer, …). On those, the sidebar shows that role's
  // own tabs (My Assignments / Panel / Documents / History for a judge) instead
  // of the console nav — otherwise the preview is stuck on its landing tab with
  // no way to reach the rest of what the role actually sees.
  const isConsoleRoute =
    pathname === '/dashboard/superadmin' || pathname.startsWith('/dashboard/superadmin/');
  // Which role's workspace is being previewed. The rail cookie (activeRailRole)
  // is authoritative — it's the only thing that can tell Judge from Scribe, who
  // share one route — but a direct URL hit (or a stale cookie) has none, so the
  // route itself is the fallback. That keeps every previewable role's own tabs
  // showing (Judge/Scribe, Announcer, Show Operations, Vendor), never the
  // console nav, no matter how the page was reached.
  const previewRole = ROLE_NAV[activeRailRole]
    ? activeRailRole
    : pathname.startsWith('/dashboard/judging')
      ? 'Judge'
      : pathname.startsWith('/dashboard/announcing')
        ? 'Announcer'
        : pathname.startsWith('/dashboard/operations')
          ? 'ShowStaff'
          : pathname.startsWith('/dashboard/vendor')
            ? 'Vendor'
            : activeRailRole;
  const previewNav = isConsoleRoute ? undefined : ROLE_NAV[previewRole];
  const previewTitle = ROLE_WORKSPACES[previewRole]?.title ?? 'Workspace';
  const activePreviewHref =
    previewNav?.find((item) => item.href === pathname)?.href ??
    previewNav?.reduce<string | null>((best, item) => {
      if (!pathname.startsWith(`${item.href}/`)) return best;
      if (!best || item.href.length > best.length) return item.href;
      return best;
    }, null) ??
    null;

  const initials =
    profile.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'FA';

  return (
    <div className="grid min-h-dvh bg-paper font-[family-name:var(--font-ar)] text-ink-deep lg:grid-cols-[74px_248px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <RoleRail currentRole={profile.platform_role} activeRole={activeRailRole} variant="console" />
      </div>

      <aside className="sticky top-0 hidden h-dvh flex-col bg-forest px-4 pb-[18px] pt-[22px] lg:flex">
        <div className="flex items-center gap-[11px] px-2 pb-[22px]">
          <span
            className={`grid size-8 flex-none place-items-center rounded-lg bg-gold ${DISPLAY} text-sm font-semibold tracking-[-.02em] text-forest`}
          >
            F&amp;A
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={`${DISPLAY} text-[17px] font-medium leading-none tracking-[-.01em] text-paper`}
            >
              Field &amp; Arena
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">
              {profile.platform_role}
            </span>
          </span>
        </div>

        {previewNav ? (
          <>
            <div className="px-2 pb-2.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-[rgba(251,250,247,.34)]">
              {previewTitle}
            </div>
            <nav className="flex flex-col gap-0.5">
              {previewNav.map((item) => {
                const active = item.href === activePreviewHref;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-[11px] rounded-lg py-2.5 pl-3 pr-2.5 text-[13.5px] font-semibold transition-colors',
                      active
                        ? 'bg-[#17402F] text-paper'
                        : 'text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)] hover:text-paper'
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-y-[9px] left-0 w-[3px] rounded-sm bg-gold"
                      />
                    )}
                    <span className={cn('flex-none', active && 'text-gold')}>
                      <NavIcon name={item.icon} size={16} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : (
          <>
            {SUPERADMIN_SIDEBAR.map((group) => (
          <div key={group.heading}>
            <div className="px-2 pb-2.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-[rgba(251,250,247,.34)]">
              {group.heading}
            </div>
            <nav className="mb-[22px] flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === '/dashboard/superadmin'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-[11px] rounded-lg py-2.5 pl-3 pr-2.5 text-[13.5px] font-semibold transition-colors',
                      active
                        ? 'bg-[#17402F] text-paper'
                        : 'text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)] hover:text-paper'
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-y-[9px] left-0 w-[3px] rounded-sm bg-gold"
                      />
                    )}
                    <ConsoleIcon
                      name={item.icon}
                      className={cn('size-4 flex-none', active && 'text-gold')}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="px-2 pb-2.5 text-[9.5px] font-bold uppercase tracking-[.16em] text-[rgba(251,250,247,.34)]">
          Tools
        </div>
        <nav className="flex flex-col gap-0.5">
          {SUPERADMIN_TOOLS.map((tool) => {
            const active = pathname.startsWith(tool.href);
            return (
              <Tip key={tool.key} text={tool.reason}>
                <Link
                  href={tool.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-[11px] rounded-lg py-2.5 pl-3 pr-2.5 text-[13.5px] font-semibold transition-colors',
                    active
                      ? 'bg-[#17402F] text-paper'
                      : 'text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)] hover:text-paper'
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-[9px] left-0 w-[3px] rounded-sm bg-gold"
                    />
                  )}
                  <ConsoleIcon name={tool.icon} className={cn('size-4 flex-none', active && 'text-gold')} />
                  {tool.label}
                </Link>
              </Tip>
            );
          })}
        </nav>
          </>
        )}

        <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(255,255,255,.10)] pt-5">
          <span className="grid size-[30px] flex-none place-items-center rounded-lg border border-[rgba(255,255,255,.12)] bg-[#17402F] text-[11.5px] font-bold text-gold-light">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px] font-semibold text-paper">{profile.name}</span>
            <span className="text-[11px] text-[rgba(251,250,247,.45)]">Platform owner</span>
          </span>
          <button
            type="button"
            onClick={() => {
              signOut();
            }}
            disabled={isSigningOut}
            title="Sign out"
            aria-label="Sign out"
            className="ml-auto grid size-7 flex-none place-items-center rounded-[7px] text-[rgba(251,250,247,.5)] transition-colors hover:bg-[rgba(255,255,255,.08)] hover:text-gold-light disabled:opacity-50"
          >
            <LogOutIcon className="size-[15px]" aria-hidden />
          </button>
        </div>
      </aside>

      <main id="top" className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex min-h-[66px] flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-line bg-paper px-5 py-3 lg:px-8">
          {isOrganizerList && <OrganizerSearch />}

          <div className="ml-auto flex flex-none items-center gap-2.5">
            <AddOrganizerDialog />
          </div>
        </header>

        <div className="max-w-[1440px] px-5 pb-14 pt-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
