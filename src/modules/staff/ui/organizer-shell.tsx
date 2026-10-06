'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SmartphoneIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ORGANIZER_NAV } from '../constants';
import { ROLE_NAV } from '@/shared/constants/role-nav';
import type { MemberOrg } from '../types';
import {
  useOrganizerShellPreview,
  useOrganizerShellOrgSwitch,
} from '../hooks/use-organizer-shell-actions';
import { useExitOrganizerView } from '@/modules/superadmin/public';
import { NavIcon } from '@/shared/ui/nav-icon';
import { RoleIcon } from '@/shared/ui/role-icon';
import { useDismiss } from '@/shared/hooks/use-dismiss';
import { ImpersonationBanner } from './impersonation-banner';
import { useSignOut } from '@/modules/auth/public';
import type { StaffProfile } from '@/shared/types/auth';
import type { DashboardShowRow } from '@/modules/shows/types';
import {
  RIDER_WORKSPACE,
  ROLE_RAIL_ORDER,
  ROLE_WORKSPACES,
  type RoleWorkspace,
} from '@/shared/constants/role-workspaces';

const COLLAPSE_KEY = 'fa-sidebar-collapsed';
const COLLAPSE_EVENT = 'fa-sidebar-collapsed-change';

// The collapsed sidebar is a per-browser preference, read straight from
// localStorage (server render is always expanded). Wrapped in try/catch
// because storage access throws when the browser blocks site data.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}
function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    /* storage blocked — nothing to persist */
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}
function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/* Show Manager routes carry the show in the path; every other organizer page
 * reads it from ?show=. Segments that are routes of their own, not shows. */
const SHOW_PATH = /^\/dashboard\/shows\/([^/]+)/;
const NON_SHOW_SEGMENTS = new Set(['new', 'incomplete']);
/* Class-scoped pages pin ?show= to the class's own show; switching shows
 * there leaves the class behind, so it goes to that show's dashboard. */
const CLASS_SCOPED_PATH = /^\/dashboard\/(?:scoring|judging\/history)\/[^/]+/;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const Chevron = ({ d }: { d: string }) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

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
  orgName = null,
  shows = [],
  panelSummary = null,
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
  orgName?: string | null;
  shows?: DashboardShowRow[];
  /** Judge/Scribe panel counts: today's classes and later ones. */
  panelSummary?: { today: number; upcoming: number; license?: string | null } | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const [mobilePreview, setMobilePreview] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<null | 'workspace' | 'user' | 'viewas' | 'bell'>(null);
  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);
  const wsRef = useDismiss<HTMLDivElement>(menu === 'workspace', closeMenu);
  const userRef = useDismiss<HTMLDivElement>(menu === 'user', closeMenu);
  const viewasRef = useDismiss<HTMLDivElement>(menu === 'viewas', closeMenu);
  const bellRef = useDismiss<HTMLDivElement>(menu === 'bell', closeMenu);
  const searchRef = useRef<HTMLInputElement>(null);
  const { isPending: isPreviewPending, setPreview, setRailRole } = useOrganizerShellPreview();
  const { isPending: isOrgPending, setOrg } = useOrganizerShellOrgSwitch();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

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
    // Scoring is reached from the Judge/Scribe workspace ("Launch Scoring")
    // but lives at '/dashboard/scoring/[classId]', outside '/dashboard/judging'.
    // Left to the generic matcher below, it would fall through to Organizer/
    // ShowAdmin's bare '/dashboard' href — a prefix of every dashboard route —
    // and silently swap a Judge into the Show Admin shell mid-scoring for
    // anyone who also holds a Show Admin role elsewhere. Resolve it explicitly.
    if (pathname.startsWith('/dashboard/scoring/')) {
      if (railRoleCookie === 'Scribe' && railRoles.includes('Scribe')) return 'Scribe';
      if (railRoles.includes('Judge')) return 'Judge';
      if (railRoles.includes('Scribe')) return 'Scribe';
    }

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
  const isOrganizerWorkspace = activeRailRole === 'Organizer' || activeRailRole === 'ShowAdmin';

  // Only offer orgs relevant to the workspace actually open — a person
  // staffed as Judge in one org and Show Admin in another shouldn't see the
  // Show Admin org while sitting in the Judge workspace (or vice versa).
  const orgsForActiveRole = memberOrgs.filter((org) => org.roles.includes(activeRailRole));

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

  // ── Focused show ──────────────────────────────────────────────────────
  const pathShowRef = (() => {
    const seg = SHOW_PATH.exec(pathname)?.[1];
    return seg && !NON_SHOW_SEGMENTS.has(seg) ? seg : null;
  })();
  const queryShowRef = searchParams.get('show');
  const requestedRef = pathShowRef ?? queryShowRef;
  const focusedShow =
    shows.find((s) => s.id === requestedRef || s.slug === requestedRef) ?? shows[0] ?? null;

  function pickShow(value: string) {
    if (value === '__new') {
      router.push('/dashboard/shows/new');
      return;
    }
    if (pathShowRef) {
      router.push(pathname.replace(SHOW_PATH, `/dashboard/shows/${value}`));
      return;
    }
    if (CLASS_SCOPED_PATH.test(pathname)) {
      router.push(`/dashboard?show=${encodeURIComponent(value)}`);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('show', value);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Nav links keep the focused show a user picked, so moving between pages
  // doesn't silently snap back to the org's default show.
  const navHref = (href: string) =>
    isOrganizerWorkspace && queryShowRef ? `${href}?show=${queryShowRef}` : href;

  const needle = query.trim().toLowerCase();
  const visibleNav = needle
    ? navItems.filter((item) => item.label.toLowerCase().includes(needle))
    : navItems;

  function selectRole(role: string) {
    const target = workspaceFor(role);
    if (!target || role === activeRailRole) return;
    setMenu(null);
    if (isSuperAdmin && impersonating && (role === 'Organizer' || role === 'ShowAdmin')) {
      setPreview(role === 'ShowAdmin' ? 'showadmin' : 'organizer', target.href);
      return;
    }
    if (isSuperAdmin && (role === 'Judge' || role === 'Scribe')) {
      setRailRole(role);
      return;
    }
    router.push(target.href);
  }

  const canSwitchWorkspace = railRoles.length > 1 || orgsForActiveRole.length > 1;
  const canPreviewRole = profile.platform_role === 'Organizer' || impersonating;
  const workspaceName = isOrganizerWorkspace
    ? (orgName ?? activeWorkspace.title)
    : activeWorkspace.title;
  const isPanelWorkspace = activeRailRole === 'Judge' || activeRailRole === 'Scribe';
  const workspaceSub = isOrganizerWorkspace
    ? activeWorkspace.title
    : isPanelWorkspace && panelSummary && panelSummary.today > 0
      ? '● Live today'
      : 'Field & Arena';
  const roleLine = impersonating
    ? 'SuperAdmin · viewing'
    : activeRailRole === 'Judge' && panelSummary?.license
      ? `Judge · ${panelSummary.license}`
      : (ROLE_WORKSPACES[profile.platform_role ?? '']?.title.replace(' Workspace', '') ??
        profile.platform_role ??
        '');

  const shell = (
    <div className={cn('dash fa-app', mobilePreview && 'dash-mobile-frame')}>
      <aside className={cn('fa-sidebar', collapsed && 'fa-collapsed')}>
        <div className="relative" ref={wsRef}>
          <button
            type="button"
            className="fa-ws w-full border-0 bg-transparent text-left"
            onClick={() => {
              setMenu(menu === 'workspace' ? null : 'workspace');
            }}
            aria-expanded={menu === 'workspace'}
            title={collapsed ? workspaceName : undefined}
          >
            <div className="fa-ws-logo">F&amp;A</div>
            <div className="fa-ws-meta">
              <b>{workspaceName}</b>
              <span>{workspaceSub}</span>
            </div>
            <div className="fa-ws-chev">
              <Chevron d="M8 9l4-4 4 4M8 15l4 4 4-4" />
            </div>
          </button>
          {menu === 'workspace' && (
            <div className="fa-viewas-menu fa-open fa-ws-menu">
              {railRoles.length > 0 && (
                <>
                  <div className="fa-mhd">{canSwitchWorkspace ? 'Workspaces' : 'Workspace'}</div>
                  {railRoles.map((role) => {
                    const target = workspaceFor(role);
                    if (!target) return null;
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={isPreviewPending}
                        className={cn(
                          'fa-mi w-full border-0 text-left',
                          role === activeRailRole ? 'fa-sel' : 'bg-transparent',
                        )}
                        onClick={() => {
                          selectRole(role);
                        }}
                      >
                        <RoleIcon role={role} size={16} />
                        {target.status === 'pending'
                          ? `${target.title} (not migrated)`
                          : target.title}
                      </button>
                    );
                  })}
                </>
              )}
              {orgsForActiveRole.length > 1 && (
                <>
                  <div className="fa-sep" />
                  <div className="fa-mhd">Organization</div>
                  {orgsForActiveRole.map((org) => {
                    const current =
                      org.orgId ===
                      (orgsForActiveRole.some((o) => o.orgId === selectedOrgId)
                        ? selectedOrgId
                        : orgsForActiveRole[0]?.orgId);
                    return (
                      <button
                        key={org.orgId}
                        type="button"
                        disabled={isOrgPending}
                        className={cn(
                          'fa-mi w-full border-0 text-left',
                          current ? 'fa-sel' : 'bg-transparent',
                        )}
                        onClick={() => {
                          setMenu(null);
                          if (!current) setOrg(org.orgId, pathname);
                        }}
                      >
                        <span className="fa-uav" style={{ background: 'var(--fa-brand)' }}>
                          {initials(org.orgName)}
                        </span>
                        {org.orgName}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        <div className="fa-sb-search">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            value={query}
            aria-label="Search navigation"
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              const first = visibleNav.at(0);
              if (e.key === 'Enter' && first) {
                router.push(navHref(first.href));
                setQuery('');
                searchRef.current?.blur();
              }
              if (e.key === 'Escape') setQuery('');
            }}
          />
          <kbd>⌘K</kbd>
        </div>

        <nav className="fa-nav" aria-label={`${activeWorkspace.title} navigation`}>
          {visibleNav.map((item, index) => {
            const active = item.key === activeNavItem?.key;
            const showGroupLabel =
              !needle && item.group && item.group !== visibleNav[index - 1]?.group;
            const count =
              item.key === 'entries' && focusedShow
                ? String(focusedShow.riderCount)
                : item.key === 'assignments' &&
                    isPanelWorkspace &&
                    panelSummary &&
                    panelSummary.today + panelSummary.upcoming > 0
                  ? String(panelSummary.today + panelSummary.upcoming)
                  : null;
            return (
              <div key={item.key} className="contents">
                {showGroupLabel && <div className="fa-nav-label">{item.group}</div>}
                <Link
                  href={navHref(item.href)}
                  prefetch={false}
                  className={cn('fa-nav-item', active && 'fa-active')}
                  title={collapsed ? item.label : item.tip}
                  aria-current={active ? 'page' : undefined}
                >
                  <NavIcon name={item.icon} size={18} />
                  <span className="fa-txt">{item.label}</span>
                  {count !== null && <span className="fa-count">{count}</span>}
                </Link>
              </div>
            );
          })}
          {visibleNav.length === 0 && <div className="fa-nav-label">No matches</div>}
        </nav>

        <div className="fa-sb-foot">
          {impersonating && <ExitToSuperAdmin />}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              className="fa-user-card w-full border-0 bg-transparent text-left"
              onClick={() => {
                setMenu(menu === 'user' ? null : 'user');
              }}
              aria-expanded={menu === 'user'}
              title={collapsed ? profile.name : undefined}
            >
              <div className="fa-user-av">{initials(profile.name)}</div>
              <div className="fa-user-meta">
                <b>{profile.name}</b>
                <span>{roleLine}</span>
              </div>
            </button>
            {menu === 'user' && (
              <div className="fa-viewas-menu fa-open fa-user-menu">
                <div className="fa-mhd">Signed in as</div>
                <div className="fa-mi">{profile.email}</div>
                <div className="fa-sep" />
                <button
                  type="button"
                  className="fa-mi w-full border-0 bg-transparent text-left"
                  disabled={isSigningOut}
                  onClick={() => {
                    signOut();
                  }}
                >
                  <Chevron d="M15 17l5-5-5-5M20 12H9M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h7" />
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="fa-main">
        {impersonating && <ImpersonationBanner orgName={impersonatedOrgName} />}

        <header className="fa-topbar">
          <button
            type="button"
            className="fa-collapse-btn"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="fa-crumbs">
            <Link href={navHref(activeWorkspace.href)} prefetch={false}>
              {workspaceName}
            </Link>
            <Chevron d="M9 6l6 6-6 6" />
            <b>
              {pathname.startsWith('/dashboard/scoring/')
                ? 'Live Scoring'
                : (activeNavItem?.label ?? activeWorkspace.title)}
            </b>
          </div>
          <div className="fa-topbar-spacer" />

          {canPreviewRole && (
            <div className="relative" ref={viewasRef}>
              <button
                type="button"
                className="fa-viewas"
                disabled={isPreviewPending}
                onClick={() => {
                  setMenu(menu === 'viewas' ? null : 'viewas');
                }}
                aria-expanded={menu === 'viewas'}
                title="Preview as Organizer (full access) or Show Admin (financials hidden)"
              >
                <span className="fa-lbl">View as</span>
                <span className="fa-role">
                  <span className="fa-rdot" />
                  {previewingAsShowAdmin ? 'Show Admin' : 'Organizer'}
                </span>
                <svg
                  className="fa-cv"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {menu === 'viewas' && (
                <div className="fa-viewas-menu fa-open">
                  <div className="fa-mhd">Preview this workspace as</div>
                  {(
                    [
                      ['organizer', 'Organizer', 'Full access'],
                      ['showadmin', 'Show Admin', 'Financials hidden'],
                    ] as const
                  ).map(([value, label, note]) => {
                    const current = (value === 'showadmin') === previewingAsShowAdmin;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          'fa-mi w-full border-0 text-left',
                          current ? 'fa-sel' : 'bg-transparent',
                        )}
                        onClick={() => {
                          setMenu(null);
                          if (!current) setPreview(value, pathname);
                        }}
                      >
                        <RoleIcon
                          role={value === 'showadmin' ? 'ShowAdmin' : 'Organizer'}
                          size={16}
                        />
                        <span className="flex-1">{label}</span>
                        <span className="text-[11px] font-medium text-[var(--fa-ink-3)]">
                          {note}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isOrganizerWorkspace && shows.length > 0 && (
            <div className="fa-org-switch">
              <span className="fa-lab">Show</span>
              <select
                aria-label="Focused show"
                value={focusedShow?.slug ?? focusedShow?.id ?? ''}
                onChange={(e) => {
                  pickShow(e.target.value);
                }}
              >
                {shows.map((show) => (
                  <option key={show.id} value={show.slug ?? show.id}>
                    {show.dateLabel ? `${show.name} · ${show.dateLabel}` : show.name}
                  </option>
                ))}
                <option value="__new">+ New Show…</option>
              </select>
            </div>
          )}

          <button
            type="button"
            className="fa-icon-btn"
            title={mobilePreview ? 'Exit mobile preview' : 'Mobile preview'}
            aria-label={mobilePreview ? 'Exit mobile preview' : 'Mobile preview'}
            aria-pressed={mobilePreview}
            onClick={() => {
              setMobilePreview((v) => !v);
            }}
          >
            <SmartphoneIcon aria-hidden />
          </button>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              className="fa-icon-btn"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={menu === 'bell'}
              onClick={() => {
                setMenu(menu === 'bell' ? null : 'bell');
              }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"
                />
              </svg>
            </button>
            {menu === 'bell' && (
              <div className="fa-viewas-menu fa-open">
                <div className="fa-mhd">Notifications</div>
                <div className="fa-mi">You&apos;re all caught up.</div>
              </div>
            )}
          </div>
        </header>
        <main className="fa-content">{children}</main>
      </div>
    </div>
  );

  // Always the same wrapper (display: contents when off) so toggling the
  // preview only swaps classes — switching wrappers remounted the whole shell
  // and the page under it, dropping local state.
  return <div className={mobilePreview ? 'dash-mobile-frame-bg' : 'contents'}>{shell}</div>;
}

function ExitToSuperAdmin() {
  const { isPending, exit } = useExitOrganizerView();
  return (
    <button
      type="button"
      className="fa-nav-item"
      disabled={isPending}
      onClick={exit}
      title="Exit to SuperAdmin"
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      </svg>
      <span className="fa-txt">{isPending ? 'Exiting…' : 'Exit to SuperAdmin'}</span>
    </button>
  );
}
