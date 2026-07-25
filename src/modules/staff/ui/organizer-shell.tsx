'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ORGANIZER_NAV, ROLE_RAIL, CURRENT_ORG_SHORT } from '../constants';
import { DashIcon } from './dash-icon';

const TOPBAR_NOTE =
  'The complete organizer view — set up and run shows, manage your team and contacts, and see the full financial picture.';

export function OrganizerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dash">
      <aside className="dash-rail">
        <div className="dash-rail-logo">
          F<b>&amp;</b>A
        </div>
        <div className="dash-rail-label">ROLES</div>
        {ROLE_RAIL.map((role) => (
          <button
            key={role.key}
            type="button"
            className={`dash-rail-btn${role.key === 'organizer' ? ' active' : ''}`}
            title={role.label}
            aria-label={role.label}
          >
            <DashIcon name={role.icon} size={20} />
          </button>
        ))}
      </aside>

      <aside className="dash-side">
        <div className="dash-side-brand">
          Field <b>&amp;</b> Arena
        </div>
        <div className="dash-side-sub">ORGANIZER WORKSPACE</div>

        <div className="dash-side-heading">VIEWING AS</div>
        <select className="dash-select" defaultValue="organizer" aria-label="Viewing as role">
          <option value="organizer">Organizer</option>
          <option value="showadmin">Show Admin</option>
        </select>

        <nav className="dash-nav" aria-label="Organizer navigation">
          {ORGANIZER_NAV.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`dash-nav-item${active ? ' active' : ''}`}
              >
                <DashIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-side-foot">
          Signed in as
          <b>{CURRENT_ORG_SHORT}</b>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <span className="dash-topbar-title">Organizer Workspace</span>
          <span className="dash-badge">Organizer</span>
          <span className="dash-topbar-note">{TOPBAR_NOTE}</span>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
