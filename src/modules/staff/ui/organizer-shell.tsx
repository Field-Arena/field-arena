'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, SmartphoneIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ORGANIZER_NAV, ROLE_NAV } from '../constants';
import type { MemberOrg } from '../data/org-selection';
import {
  useOrganizerShellPreview,
  useOrganizerShellOrgSwitch,
} from '../hooks/use-organizer-shell-actions';
import { setRailRole } from '@/shared/lib/rail-role';
import { NavIcon } from '@/shared/ui/nav-icon';
import { RoleIcon } from '@/shared/ui/role-icon';
import { Tip } from '@/shared/ui/tip';
import { ImpersonationBanner } from './impersonation-banner';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { StaffProfile } from '@/modules/auth/data/queries';
import {
  RIDER_WORKSPACE,
  ROLE_RAIL_ORDER,
  ROLE_WORKSPACES,
  type RoleWorkspace,
} from '@/shared/constants/role-workspaces';

export function OrganizerShell({
  children,
  profile,
  workspace,
  impersonating = false,
  impersonatedOrgName = null,
  previewingAsShowAdmin = false,
  railRoleCookie = null,
  selectedOrgId = null,
  memberOrgs = [],
  availableRoles = [],
}: {
  children: ReactNode;
  profile: StaffProfile;
  workspace: RoleWorkspace;
  impersonating?: boolean;

  impersonatedOrgName?: string | null;

  previewingAsShowAdmin?: boolean;

  railRoleCookie?: string | null;

  selectedOrgId?: string | null;

  memberOrgs?: MemberOrg[];

  availableRoles?: string[];
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const [mobilePreview, setMobilePreview] = useState(false);
  const {
    isPending: isPreviewPending,
    setPreview,
    runTransition: runPreviewTransition,
  } = useOrganizerShellPreview();
  const { isPending: isOrgPending, setOrg } = useOrganizerShellOrgSwitch();

  const isSuperAdmin = profile.platform_role === 'SuperAdmin';

  const workspaceFor = (role: string): RoleWorkspace | undefined =>
    role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];

  // Workspaces a non-SuperAdmin may switch between: what the server said they
  // qualify for, falling back to just their own platform_role.
  const effectiveAvailable =
    availableRoles.length > 0
      ? availableRoles
      : profile.platform_role
        ? [profile.platform_role]
        : [];

  const railRoles = isSuperAdmin
    ? ROLE_RAIL_ORDER.filter((role) => workspaceFor(role) !== undefined)
    : ROLE_RAIL_ORDER.filter(
        (role) => effectiveAvailable.includes(role) && workspaceFor(role) !== undefined,
      );

  const activeRailRole = (() => {
    if (!isSuperAdmin) {
      // Match the MOST specific workspace href. Organizer/ShowAdmin live at
      // '/dashboard', which is a prefix of every '/dashboard/*' route, so a
      // plain first-match would let it shadow Judge (/dashboard/judging) etc.
      // Pick the longest matching href instead.
      const match = railRoles
        .map((role) => ({ role, href: workspaceFor(role)?.href ?? '' }))
        .filter(({ href }) => href !== '' && (pathname === href || pathname.startsWith(`${href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0]?.role;
      return match ?? profile.platform_role ?? 'Organizer';
    }
    if (pathname === '/dashboard') return previewingAsShowAdmin ? 'ShowAdmin' : 'Organizer';

    const judgeHref = ROLE_WORKSPACES.Judge?.href;
    if (judgeHref && (pathname === judgeHref || pathname.startsWith(`${judgeHref}/`))) {
      return railRoleCookie === 'Scribe' ? 'Scribe' : 'Judge';
    }

    const uniqueMatch = ROLE_RAIL_ORDER.find((r) => {
      if (r === 'Organizer' || r === 'ShowAdmin' || r === 'Judge' || r === 'Scribe') return false;
      const w = workspaceFor(r);
      return w ? pathname === w.href || pathname.startsWith(`${w.href}/`) : false;
    });
    return uniqueMatch ?? profile.platform_role ?? 'SuperAdmin';
  })();

  const activeWorkspace = workspaceFor(activeRailRole) ?? workspace;

  const baseNavItems = ROLE_NAV[activeRailRole] ?? ORGANIZER_NAV;

  const navItems = previewingAsShowAdmin
    ? baseNavItems.filter((item) => item.key !== 'billing')
    : baseNavItems;

  const activeNavItem =
    navItems.find((n) => n.href === pathname) ??
    navItems.reduce<(typeof navItems)[number] | null>((best, item) => {
      if (!pathname.startsWith(`${item.href}/`)) return best;
      if (!best || item.href.length > best.href.length) return item;
      return best;
    }, null);

  const shell = (
    <div className={cn('dash', mobilePreview && 'dash-mobile-frame')}>
      <aside className="dash-rail">
        <div className="dash-rail-logo">
          F<b>&amp;</b>A
        </div>
        <div className="dash-rail-label">
          {isSuperAdmin || railRoles.length > 1 ? 'ROLES' : 'ROLE'}
        </div>
        {railRoles.map((role) => {
          const target = workspaceFor(role);
          if (!target) return null;
          const label =
            target.status === 'pending' ? `${target.title} (not migrated)` : target.title;

          if (!isSuperAdmin) {
            const active = role === activeRailRole;
            return (
              <Tip key={role} text={target.title} className="grid place-items-center">
                <Link
                  href={target.href}
                  className={cn('dash-rail-btn', active && 'active')}
                  aria-label={target.title}
                  aria-current={active ? 'page' : undefined}
                >
                  <RoleIcon role={role} size={20} />
                </Link>
              </Tip>
            );
          }

          if (impersonating && (role === 'Organizer' || role === 'ShowAdmin')) {
            const active = role === activeRailRole;
            return (
              <Tip key={role} text={label} className="grid place-items-center">
                <button
                  type="button"
                  disabled={isPreviewPending}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn('dash-rail-btn', active && 'active')}
                  onClick={() => {
                    if (active) return;

                    setPreview(role === 'ShowAdmin' ? 'showadmin' : 'organizer', target.href);
                  }}
                >
                  <RoleIcon role={role} size={20} />
                </button>
              </Tip>
            );
          }

          if (role === 'Judge' || role === 'Scribe') {
            const active = role === activeRailRole;
            return (
              <Tip key={role} text={label} className="grid place-items-center">
                <button
                  type="button"
                  disabled={isPreviewPending}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn('dash-rail-btn', active && 'active')}
                  onClick={() => {
                    if (active) return;
                    runPreviewTransition(async () => {
                      await setRailRole(role);
                    });
                  }}
                >
                  <RoleIcon role={role} size={20} />
                </button>
              </Tip>
            );
          }

          const active = role === activeRailRole;
          return (
            <Tip key={role} text={label} className="grid place-items-center">
              <Link
                href={target.href}
                className={cn('dash-rail-btn', active && 'active')}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <RoleIcon role={role} size={20} />
              </Link>
            </Tip>
          );
        })}
      </aside>

      <aside className="dash-side">
        <div className="dash-side-brand">
          Field <b>&amp;</b> Arena
        </div>
        <div className="dash-side-sub">{activeWorkspace.title.toUpperCase()}</div>

        {memberOrgs.length > 1 && (
          <>
            <div className="dash-side-heading">ORGANIZATION</div>
            <Tip text="Switch between organizations you have access to" className="block w-full">
              <select
                className="dash-select"
                value={selectedOrgId ?? ''}
                disabled={isOrgPending}
                onChange={(e) => {
                  setOrg(e.target.value, pathname);
                }}
                aria-label="Selected organization"
              >
                {memberOrgs.map((org) => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.orgName}
                  </option>
                ))}
              </select>
            </Tip>
          </>
        )}

        {(profile.platform_role === 'Organizer' || impersonating) && (
          <>
            <div className="dash-side-heading">VIEWING AS</div>
            <Tip
              text="Preview as Organizer (full access) or ShowAdmin (financials hidden)"
              className="block w-full"
            >
              <select
                className="dash-select"
                value={previewingAsShowAdmin ? 'showadmin' : 'organizer'}
                disabled={isPreviewPending}
                onChange={(e) => {
                  const next = e.target.value === 'showadmin' ? 'showadmin' : 'organizer';
                  setPreview(next, pathname);
                }}
                aria-label="Viewing as role"
              >
                <option value="organizer">Organizer</option>
                <option value="showadmin">Show Admin</option>
              </select>
            </Tip>
          </>
        )}

        <nav className="dash-nav" aria-label={`${activeWorkspace.title} navigation`}>
          {navItems.map((item) => {
            const active = item.key === activeNavItem?.key;
            return (
              <Tip key={item.key} text={item.tip} className="block w-full">
                <Link href={item.href} className={cn('dash-nav-item', active && 'active')}>
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </Tip>
            );
          })}
        </nav>

        <div className="dash-side-foot">
          Signed in as
          <b>{profile.name}</b>
          <button
            type="button"
            onClick={() => {
              signOut();
            }}
            disabled={isSigningOut}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <LogOutIcon className="size-3.5" aria-hidden />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="dash-main">
        {impersonating && <ImpersonationBanner orgName={impersonatedOrgName} />}

        <header className="dash-topbar">
          <span className="dash-topbar-title">{activeWorkspace.title}</span>
          <span className="dash-badge">{activeRailRole}</span>
          <span className="dash-topbar-note">{activeWorkspace.hint}</span>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMobilePreview((v) => !v);
        }}
        className="dash-mobile-toggle"
      >
        <SmartphoneIcon size={14} aria-hidden />
        {mobilePreview ? 'Exit mobile preview' : 'Mobile preview'}
      </button>
      {mobilePreview ? <div className="dash-mobile-frame-bg">{shell}</div> : shell}
    </>
  );
}
