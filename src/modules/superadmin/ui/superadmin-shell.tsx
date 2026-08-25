'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { StaffProfile } from '@/modules/auth/data/queries';
import { RoleRail } from '@/shared/ui/role-rail';
import { NavIcon } from '@/shared/ui/nav-icon';
import { Tip } from '@/shared/ui/tip';
import { cn } from '@/shared/lib/utils';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { ROLE_NAV } from '@/modules/staff/constants';
import { SUPERADMIN_SIDEBAR, SUPERADMIN_TOOLS } from '@/modules/superadmin/constants';
import { OrganizerSearch } from '@/modules/superadmin/ui/organizer-search';
import { AddOrganizerDialog } from '@/modules/superadmin/ui/add-organizer-dialog';
import { ConsoleIcon } from '@/modules/superadmin/ui/console-icon';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

export function SuperAdminShell({
  children,
  profile,
  activeRailRole,
}: {
  children: ReactNode;
  profile: StaffProfile;

  activeRailRole: string;
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const isOrganizerList = pathname === '/dashboard/superadmin';

  const isConsoleRoute =
    pathname === '/dashboard/superadmin' || pathname.startsWith('/dashboard/superadmin/');

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
    <div className="bg-paper text-ink-deep grid min-h-dvh font-[family-name:var(--font-ar)] lg:grid-cols-[74px_248px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <RoleRail
          currentRole={profile.platform_role}
          activeRole={activeRailRole}
          variant="console"
        />
      </div>

      <aside className="bg-forest sticky top-0 hidden h-dvh flex-col px-4 pt-[22px] pb-[18px] lg:flex">
        <div className="flex items-center gap-[11px] px-2 pb-[22px]">
          <span
            className={`bg-gold grid size-8 flex-none place-items-center rounded-lg ${DISPLAY} text-forest text-sm font-semibold tracking-[-.02em]`}
          >
            F&amp;A
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={`${DISPLAY} text-paper text-[17px] leading-none font-medium tracking-[-.01em]`}
            >
              Field &amp; Arena
            </span>
            <span className="text-gold text-[9px] font-bold tracking-[.16em] uppercase">
              {profile.platform_role}
            </span>
          </span>
        </div>

        {previewNav ? (
          <>
            <div className="px-2 pb-2.5 text-[9.5px] font-bold tracking-[.16em] text-[rgba(251,250,247,.34)] uppercase">
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
                      'relative flex items-center gap-[11px] rounded-lg py-2.5 pr-2.5 pl-3 text-[13.5px] font-semibold transition-colors',
                      active
                        ? 'text-paper bg-[#17402F]'
                        : 'hover:text-paper text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)]',
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="bg-gold absolute inset-y-[9px] left-0 w-[3px] rounded-sm"
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
                <div className="px-2 pb-2.5 text-[9.5px] font-bold tracking-[.16em] text-[rgba(251,250,247,.34)] uppercase">
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
                          'relative flex items-center gap-[11px] rounded-lg py-2.5 pr-2.5 pl-3 text-[13.5px] font-semibold transition-colors',
                          active
                            ? 'text-paper bg-[#17402F]'
                            : 'hover:text-paper text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)]',
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="bg-gold absolute inset-y-[9px] left-0 w-[3px] rounded-sm"
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

            <div className="px-2 pb-2.5 text-[9.5px] font-bold tracking-[.16em] text-[rgba(251,250,247,.34)] uppercase">
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
                        'relative flex items-center gap-[11px] rounded-lg py-2.5 pr-2.5 pl-3 text-[13.5px] font-semibold transition-colors',
                        active
                          ? 'text-paper bg-[#17402F]'
                          : 'hover:text-paper text-[rgba(251,250,247,.66)] hover:bg-[rgba(255,255,255,.06)]',
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="bg-gold absolute inset-y-[9px] left-0 w-[3px] rounded-sm"
                        />
                      )}
                      <ConsoleIcon
                        name={tool.icon}
                        className={cn('size-4 flex-none', active && 'text-gold')}
                      />
                      {tool.label}
                    </Link>
                  </Tip>
                );
              })}
            </nav>
          </>
        )}

        <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(255,255,255,.10)] pt-5">
          <span className="text-gold-light grid size-[30px] flex-none place-items-center rounded-lg border border-[rgba(255,255,255,.12)] bg-[#17402F] text-[11.5px] font-bold">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-paper truncate text-[12.5px] font-semibold">{profile.name}</span>
            <span className="text-[11px] text-[rgba(251,250,247,.45)]">Platform owner</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              signOut();
            }}
            disabled={isSigningOut}
            title="Sign out"
            aria-label="Sign out"
            className="hover:text-gold-light ml-auto grid size-7 flex-none place-items-center rounded-[7px] p-0 text-[rgba(251,250,247,.5)] transition-colors hover:bg-[rgba(255,255,255,.08)] disabled:opacity-50"
          >
            <LogOutIcon className="size-[15px]" aria-hidden />
          </Button>
        </div>
      </aside>

      <main id="top" className="flex min-w-0 flex-col">
        <header className="border-line bg-paper sticky top-0 z-40 flex min-h-[66px] flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b px-5 py-3 lg:px-8">
          {isOrganizerList && <OrganizerSearch />}

          <div className="ml-auto flex flex-none items-center gap-2.5">
            <AddOrganizerDialog />
          </div>
        </header>

        <div className="max-w-[1440px] px-5 pt-8 pb-14 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
