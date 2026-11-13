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
import { usePathname, useRouter } from 'next/navigation';
import { useSignOut } from '@/modules/auth/public';
import type { StaffProfile } from '@/shared/types/auth';
import { NavIcon } from '@/shared/ui/nav-icon';
import { useDismiss } from '@/shared/hooks/use-dismiss';
import { cn } from '@/shared/lib/utils';
import { initials } from '@/shared/lib/format/name';
import { ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { ROLE_NAV } from '@/shared/constants/role-nav';
import { SUPERADMIN_SIDEBAR, SUPERADMIN_TOOLS } from '@/modules/superadmin/constants';
import { OrganizerSearch, type OrganizerOption } from '@/modules/superadmin/ui/organizer-search';
import { ViewAsMenu } from '@/modules/superadmin/ui/view-as-menu';

const COLLAPSE_KEY = 'fa-sidebar-collapsed';
const COLLAPSE_EVENT = 'fa-sidebar-collapsed-change';

// Same per-browser collapsed-sidebar preference the organizer shell uses.
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

/* Console icons from the redesign's SuperAdmin sidebar. */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const CONSOLE_ICONS: Record<string, ReactNode> = {
  overview: <path {...S} d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" />,
  organizers: <path {...S} d="M3 21V7l9-4 9 4v14M9 21v-5h6v5" />,
  catalog: <path {...S} d="M4 5h10v14H4zM14 8h6v11h-6" />,
  documents: (
    <path {...S} d="M4 5a2 2 0 012-2h5l2 3h5a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
  ),
  billing: <path {...S} d="M3 7h18v10H3zM3 11h18" />,
  users: <path {...S} d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6z" />,
  preview: (
    <>
      <path {...S} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle {...S} cx="12" cy="12" r="3" />
    </>
  ),
  funnel: <path {...S} d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  demo: <path {...S} d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />,
};

function ConsoleNavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      {CONSOLE_ICONS[name] ?? CONSOLE_ICONS.organizers}
    </svg>
  );
}

const Chevron = ({ d }: { d: string }) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

interface NavLinkItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  count?: number;
  tip?: string;
  console: boolean;
}

export function SuperAdminShell({
  children,
  profile,
  activeRailRole,
  organizers,
}: {
  children: ReactNode;
  profile: StaffProfile;
  activeRailRole: string;
  organizers: OrganizerOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [query, setQuery] = useState('');
  const [userMenu, setUserMenu] = useState(false);
  const closeUserMenu = useCallback(() => {
    setUserMenu(false);
  }, []);
  const userRef = useDismiss<HTMLDivElement>(userMenu, closeUserMenu);
  const [bellOpen, setBellOpen] = useState(false);
  const closeBell = useCallback(() => {
    setBellOpen(false);
  }, []);
  const bellRef = useDismiss<HTMLDivElement>(bellOpen, closeBell);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const isConsoleRoute =
    pathname === '/dashboard/superadmin' || pathname.startsWith('/dashboard/superadmin/');

  // Previewing another role's workspace (via View as) swaps the sidebar for
  // that role's nav, the way the rail did.
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

  const groups: { heading: string; items: NavLinkItem[] }[] = previewNav
    ? [
        {
          heading: previewTitle,
          items: previewNav.map((item) => ({ ...item, console: false })),
        },
      ]
    : [
        ...SUPERADMIN_SIDEBAR.map((group) => ({
          heading: group.heading,
          items: group.items.map((item) => ({
            ...item,
            console: true,
            count: item.key === 'organizers' ? organizers.length : undefined,
          })),
        })),
        {
          heading: 'Tools',
          items: SUPERADMIN_TOOLS.map((tool) => ({ ...tool, tip: tool.reason, console: true })),
        },
      ];

  const allItems = groups.flatMap((g) => g.items);
  const activeItem = allItems.reduce<NavLinkItem | null>((best, item) => {
    const hit =
      item.href === '/dashboard/superadmin'
        ? pathname === item.href
        : item.href === '/dashboard/superadmin/organizers'
          ? pathname === item.href || pathname.startsWith('/dashboard/superadmin/organizations')
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!hit) return best;
    return !best || item.href.length > best.href.length ? item : best;
  }, null);

  const needle = query.trim().toLowerCase();
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: needle ? g.items.filter((i) => i.label.toLowerCase().includes(needle)) : g.items,
    }))
    .filter((g) => g.items.length > 0);

  const crumb = activeItem?.label ?? (previewNav ? previewTitle : 'Console');

  return (
    <div className="dash fa-app">
      <aside className={cn('fa-sidebar', collapsed && 'fa-collapsed')}>
        <Link
          href="/dashboard/superadmin"
          prefetch={false}
          className="fa-ws"
          title={collapsed ? 'Field & Arena' : undefined}
        >
          <div className="fa-ws-logo">F&amp;A</div>
          <div className="fa-ws-meta">
            <b>Field &amp; Arena</b>
            <span>Platform · SuperAdmin</span>
          </div>
          <div className="fa-ws-chev">
            <Chevron d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </div>
        </Link>

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
              const first = visibleGroups[0]?.items[0];
              if (e.key === 'Enter' && first) {
                router.push(first.href);
                setQuery('');
                searchRef.current?.blur();
              }
              if (e.key === 'Escape') setQuery('');
            }}
          />
          <kbd>⌘K</kbd>
        </div>

        <nav className="fa-nav" aria-label="SuperAdmin navigation">
          {visibleGroups.map((group) => (
            <div key={group.heading}>
              <div className="fa-nav-label">{group.heading}</div>
              {group.items.map((item) => {
                const active = item.key === activeItem?.key && item.href === activeItem.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    prefetch={false}
                    className={cn('fa-nav-item', active && 'fa-active')}
                    title={collapsed ? item.label : item.tip}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.console ? (
                      <ConsoleNavIcon name={item.icon} />
                    ) : (
                      <NavIcon name={item.icon} size={18} />
                    )}
                    <span className="fa-txt">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="fa-count">{item.count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
          {visibleGroups.length === 0 && <div className="fa-nav-label">No matches</div>}
        </nav>

        <div className="fa-sb-foot">
          {previewNav && (
            <Link href="/dashboard/superadmin" prefetch={false} className="fa-nav-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              <span className="fa-txt">Back to console</span>
            </Link>
          )}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              className="fa-user-card w-full border-0 bg-transparent text-left"
              aria-expanded={userMenu}
              title={collapsed ? profile.name : undefined}
              onClick={() => {
                setUserMenu((v) => !v);
              }}
            >
              <div className="fa-user-av">{initials(profile.name) || 'FA'}</div>
              <div className="fa-user-meta">
                <b>{profile.name}</b>
                <span>SuperAdmin · Owner</span>
              </div>
            </button>
            {userMenu && (
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
        <header className="fa-topbar">
          <button
            type="button"
            className="fa-collapse-btn"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => {
              writeCollapsed(!collapsed);
            }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="fa-crumbs">
            <b>{crumb}</b>
          </div>
          <div className="fa-topbar-spacer" />

          {isConsoleRoute && <OrganizerSearch organizers={organizers} />}
          <ViewAsMenu activeRole={activeRailRole} />

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              className="fa-icon-btn"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={bellOpen}
              onClick={() => {
                setBellOpen((v) => !v);
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
            {bellOpen && (
              <div className="fa-viewas-menu fa-open">
                <div className="fa-mhd">Notifications</div>
                <div className="fa-mi">You&apos;re all caught up.</div>
              </div>
            )}
          </div>
        </header>

        <main id="top" className="fa-content">
          {children}
        </main>
      </div>
    </div>
  );
}
