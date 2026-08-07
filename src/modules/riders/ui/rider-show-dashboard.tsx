'use client';

import { useState } from 'react';
import { useSignOutRider } from '../hooks/use-rider-auth-mutations';
import { HorseTabView } from './horse-tab-view';
import { LEGACY_COLOR, LEGACY_GEORGIA } from './legacy-theme';
import { ProfileTab } from './profile-tab';
import { PurchasesTab } from './purchases-tab';
import { ResultsView } from './results-view';
import { ScheduleTab } from './schedule-tab';
import { NavIcon } from '@/shared/ui/nav-icon';
import { RoleIcon } from '@/shared/ui/role-icon';
import type {
  AddOnWithRemaining,
  ClassWithCapacity,
  DocumentRequirement,
  HorseWithDocumentUrls,
  OrderRow,
  RiderEntryDetail,
  RiderRow,
  ShowRow,
} from '../types';

type DashTab = 'schedule' | 'profile' | 'horse' | 'purchases' | 'results';

/**
 * Icons weren't in legacy's sidebar at all (rider.html's `.dash-tab` items
 * are plain text — confirmed by direct read of that markup). Added anyway,
 * on request, so the rider sidebar matches this app's OWN established
 * pattern — every other role's sidebar (`ORGANIZER_NAV` etc.,
 * modules/staff/constants.ts) pairs an icon with each label via the same
 * `NavIcon` lookup used here. `horses` is an exact semantic match already in
 * that icon set; `schedule`/`users`/`eventsales` are the closest existing
 * fits for My Schedule/Profile/Purchases — no new icon glyphs were drawn.
 */
const NAV_ITEMS: { key: Exclude<DashTab, 'results'>; label: string; icon: string }[] = [
  { key: 'schedule', label: 'My Schedule', icon: 'schedule' },
  { key: 'profile', label: 'Profile', icon: 'users' },
  { key: 'horse', label: 'Horse', icon: 'horses' },
  { key: 'purchases', label: 'Purchases', icon: 'eventsales' },
];

/**
 * A darker shade of `LEGACY_COLOR.hunterDeep`, for the narrow role rail only
 * — mirrors the two-tone `--hunter-deep`/`--hunter` split the organizer
 * workspace uses between its own rail and sidebar (dashboard.css), scoped to
 * the rider portal's own palette instead of borrowing the organizer's.
 */
const RAIL_DARK = '#172B21';

/**
 * Shared by both sidebar columns so they scroll independently of `<main>`
 * and never fall out of sync with each other. `77` is the rider header's
 * rendered height (`rider/layout.tsx`'s `18px 30px` padding plus its content) —
 * there's no shared constant for it today because only this file needs to
 * offset against it; if the header's padding ever changes, this value has to
 * change with it.
 */
const STICKY_SIDEBAR_STYLE = {
  minHeight: 'calc(100vh - 77px)',
  position: 'sticky',
  top: 77,
} as const;

/**
 * The post-purchase dashboard — legacy's `#dashboard-view` (rider.html
 * lines 584-720), pixel-matched: a 220px dark sidebar (`.rider-sidebar`,
 * `--hunter-deep:#1F3A2E`) with four plain-text nav items (no icons — legacy
 * has none), replaces the entry-drafting wizard entirely once the rider
 * already has at least one entry at this show (legacy's `realBoot` gate).
 *
 * "Results" is deliberately NOT a fifth sidebar item — legacy's
 * `showDashTab('results')` toggles the same panel-swap mechanism as the
 * other four tabs, but no `.dash-tab` carries `data-dtab="results"`, so
 * viewing results highlights none of the four nav items. It's reached only
 * via the "🏆 View Results" button on the Schedule tab (shown only once an
 * entry has a score) and left via "← Back to My Schedule" — reproduced here
 * as a fifth `activeTab` state with no matching nav button, not a real tab.
 */
export function RiderShowDashboard({
  rider,
  show,
  venueAddress,
  classes,
  addOns,
  entries,
  orders,
  horses,
  documentRequirements,
}: {
  rider: RiderRow;
  show: ShowRow;
  venueAddress: string | null;
  classes: ClassWithCapacity[];
  addOns: AddOnWithRemaining[];
  entries: RiderEntryDetail[];
  orders: OrderRow[];
  horses: HorseWithDocumentUrls[];
  documentRequirements: DocumentRequirement[];
}) {
  const [activeTab, setActiveTab] = useState<DashTab>('schedule');
  const signOut = useSignOutRider();
  const firstName = (rider.first_name?.trim() ?? '') || rider.email;
  const hasResults = entries.some((entry) => entry.finalPct != null);

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <aside
        style={{
          width: 56,
          flex: 'none',
          background: RAIL_DARK,
          padding: '14px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ...STICKY_SIDEBAR_STYLE,
        }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: '0.12em',
            color: '#7f8f84',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          Role
        </div>
        <span
          aria-label="Rider Portal"
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            display: 'grid',
            placeItems: 'center',
            background: LEGACY_COLOR.gold,
            color: LEGACY_COLOR.hunterDeep,
          }}
        >
          <RoleIcon role="Rider" size={20} />
        </span>
      </aside>

      <aside
        style={{
          width: 220,
          flex: 'none',
          background: LEGACY_COLOR.hunterDeep,
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          ...STICKY_SIDEBAR_STYLE,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: '0.14em',
            color: '#9db5a8',
            textTransform: 'uppercase',
            padding: '0 22px 16px',
          }}
        >
          Rider Portal
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 22px',
                  borderRadius: 0,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 600,
                  border: 'none',
                  borderLeft: active ? `3px solid ${LEGACY_COLOR.gold}` : '3px solid transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                  background: active ? 'rgba(201,162,39,0.14)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <NavIcon name={item.icon} size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 22px' }}>
          <button
            type="button"
            onClick={() => {
              signOut.mutate();
            }}
            disabled={signOut.isPending}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              padding: '12px 22px',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {signOut.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: LEGACY_GEORGIA, fontSize: 26, color: LEGACY_COLOR.ink, margin: 0 }}>
            Welcome, {firstName}
          </h1>
          <p style={{ color: LEGACY_COLOR.inkSoft, margin: '4px 0 0' }}>
            Your show details, schedule, and everything you&apos;ve purchased — in one place.
          </p>
        </div>

        {activeTab === 'schedule' && (
          <ScheduleTab
            show={show}
            venueAddress={venueAddress}
            entries={entries}
            classes={classes}
            hasResults={hasResults}
            onViewResults={() => {
              setActiveTab('results');
            }}
          />
        )}
        {activeTab === 'profile' && <ProfileTab rider={rider} />}
        {activeTab === 'horse' && (
          <HorseTabView horses={horses} documentRequirements={documentRequirements} />
        )}
        {activeTab === 'purchases' && (
          <PurchasesTab show={show} rider={rider} entries={entries} orders={orders} addOns={addOns} />
        )}
        {activeTab === 'results' && (
          <ResultsView
            entries={entries}
            onBack={() => {
              setActiveTab('schedule');
            }}
          />
        )}
      </main>
    </div>
  );
}
