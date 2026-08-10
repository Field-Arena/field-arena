'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarIcon,
  CheckCircle2Icon,
  ContactIcon,
  DatabaseIcon,
  DollarSignIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutGridIcon,
  MapPinIcon,
  PawPrintIcon,
  PencilIcon,
  SearchIcon,
  ShoppingBagIcon,
  UsersIcon,
  Volume2Icon,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

/**
 * Demo-content stand-ins for the 4 Signup Flow Preview steps that sit behind
 * real auth (Organizer/ShowAdmin-ShowStaff/Judge-Scribe/Announcer/Vendor) —
 * SuperAdmin has no session for any of those roles, so iframing the real
 * route would only ever show a login screen, not the page.
 *
 * Sized to match the depth of the deployed legacy preview tool
 * (field-arena.com/views/preview-signup-pages.html), which iframes each
 * page bare — every legacy page has its own built-in demo mode (seeded
 * sample data, shown with no org/show/email query params), and that demo
 * mode is a full workspace: sidebar, live-feeling status, seeded
 * assignment/booking lists, not a bare summary. These are that same idea,
 * restyled to this app's design tokens, with zero real Supabase calls.
 * Rider doesn't need one of these (see signup-flow-preview.tsx) — it embeds
 * the real `/rider/demo` route instead, which already is exactly this kind
 * of self-contained, seeded, no-write walkthrough.
 */

// ---------------------------------------------------------------------------
// Shared workspace chrome — sidebar + live clock, reused by the 4 role
// previews below so their content areas can focus on what's role-specific.
// ---------------------------------------------------------------------------

interface WorkspaceNavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

function WorkspaceFrame({
  roleLabel,
  navItems,
  footer,
  liveToday,
  children,
}: {
  roleLabel: string;
  navItems: WorkspaceNavItem[];
  /** Rendered at the bottom of the sidebar — a "Signed in as X" identity, or a role switcher for the Organizer view. */
  footer: ReactNode;
  liveToday?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-4xl overflow-hidden rounded-xl border border-line">
      <aside className="flex w-[220px] flex-none flex-col bg-forest px-3 pb-4 pt-5 text-paper">
        <div className="mb-1 flex items-center gap-2 px-2">
          <span
            className={`grid size-7 flex-none place-items-center rounded-md bg-gold ${DISPLAY} text-xs font-semibold text-forest`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-[14px] font-medium text-paper`}>Field &amp; Arena</span>
        </div>
        <div className="mb-4 px-2 text-[9.5px] font-bold uppercase tracking-[.16em] text-gold">
          {roleLabel}
        </div>
        {liveToday && (
          <div className="mb-3 flex items-center gap-1.5 px-2 text-[10.5px] font-bold uppercase tracking-[.1em] text-mint">
            <span className="size-1.5 rounded-full bg-mint" aria-hidden />
            Live today
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold ${
                item.active ? 'bg-[#17402F] text-paper' : 'text-[rgba(251,250,247,.66)]'
              }`}
            >
              <item.icon className={`size-4 flex-none ${item.active ? 'text-gold' : ''}`} aria-hidden />
              {item.label}
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t border-[rgba(255,255,255,.1)] pt-3 text-[11.5px] text-[rgba(251,250,247,.66)]">
          {footer}
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-paper p-6">{children}</div>
    </div>
  );
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); }, 1000);
    return () => { clearInterval(id); };
  }, []);
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function RingStatusBar({ rings }: { rings: { label: string; offset: string }[] }) {
  const time = useClock();
  return (
    <div className="mb-4 flex overflow-hidden rounded-lg border border-line font-mono text-xs font-bold">
      <div className="flex items-center bg-forest px-3 py-2 text-paper">{time}</div>
      {rings.map((ring) => (
        <div key={ring.label} className="flex-1 bg-mint px-3 py-2 text-center text-forest">
          {ring.label} {ring.offset}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const FIELD =
  'h-auto w-full rounded-[10px] border border-field bg-white px-4 py-3 text-[14.5px] text-ink-deep';
const LABEL = 'mb-2 block text-xs font-bold uppercase tracking-[.1em] text-forest';
const GROUP = 'mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold';

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input className={FIELD} value={value} readOnly />
    </div>
  );
}

/** Same field set as the real `OnboardingForm` (organizations/ui/onboarding-form.tsx), pre-filled with sample data. */
export function OrganizerOnboardingPreview() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[18px] border border-line bg-white p-9 text-center">
        <CheckCircle2Icon className="mx-auto mb-3 size-8 text-forest" aria-hidden />
        <h1 className={`${DISPLAY} mb-2 text-2xl font-medium text-forest`}>You&apos;re all set</h1>
        <p className="text-[14.5px] text-fa-muted">
          Demo only — nothing here was saved. A real organizer lands in their workspace next.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
        Demo data — a real invited organizer sees their own contact info pre-filled here instead.
      </div>
      <div className="rounded-[18px] border border-line bg-white p-7 sm:p-9">
        <h1 className={`${DISPLAY} mb-2.5 text-[26px] font-medium leading-[1.06] tracking-[-.022em] text-forest`}>
          Complete Your Organization Profile
        </h1>
        <p className="mb-7 text-[14.5px] leading-[1.6] text-fa-muted">
          Welcome to Field &amp; Arena. A few details about your organization and you&apos;re ready to
          build your first show.
        </p>

        <div className="space-y-5">
          <div>
            <div className={GROUP}>Organization</div>
            <DemoField label="Organization name" value="Meadowbrook Equestrian Center" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DemoField label="Organization email" value="office@meadowbrook.example" />
              <DemoField label="Website" value="www.meadowbrook.example" />
            </div>
            <div className="mt-4">
              <DemoField label="Phone" value="(555) 555-0100" />
            </div>
          </div>
          <div>
            <div className={GROUP}>Location</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoField label="City" value="Asheville" />
              <DemoField label="State / Region" value="NC" />
            </div>
            <div className="mt-4">
              <DemoField label="Country" value="United States" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setSubmitted(true); }}
            className="h-auto w-full rounded-[10px] bg-gold px-6 py-[15px] text-[15px] font-bold text-forest transition-colors hover:bg-gold-light"
          >
            Finish setup
          </button>
        </div>
      </div>
    </div>
  );
}

const SHOWADMIN_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'Dashboard', active: true },
  { icon: DatabaseIcon, label: 'Member Database' },
  { icon: PencilIcon, label: 'Show Manager' },
  { icon: CalendarIcon, label: 'Master Schedule' },
  { icon: UsersIcon, label: 'Users' },
  { icon: MapPinIcon, label: 'Venues' },
  { icon: PawPrintIcon, label: 'Horses' },
  { icon: ShoppingBagIcon, label: 'Event Sales' },
  { icon: DollarSignIcon, label: 'Financial' },
];

/**
 * The ShowManager workspace an invited ShowAdmin/ShowStaff lands in after
 * general login — a demo of the dashboard's landing view, one representative
 * screen of the organizer workspace this app already has fully built (18
 * setup tabs, schedule, entries, riders, horses, vendors, run-show tools —
 * their own many-route section of the app, not something this single
 * preview screen replicates in full).
 */
export function ShowStaffWorkspacePreview() {
  return (
    <WorkspaceFrame
      roleLabel="Organizer workspace"
      navItems={SHOWADMIN_NAV}
      footer={
        <div>
          <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[.14em] text-[rgba(251,250,247,.4)]">
            Viewing as
          </div>
          <div className="rounded-md border border-[rgba(255,255,255,.15)] bg-[#17402F] px-2.5 py-1.5 font-semibold text-paper">
            Organizer
          </div>
        </div>
      }
    >
      <h1 className={`${DISPLAY} text-2xl font-medium text-forest`}>Dashboard</h1>
      <p className="mb-4 text-sm text-fa-muted">Everything across your shows, in one place.</p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-mint/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold" aria-hidden />
          <span className="font-semibold text-forest">Peachtree Dressage Association</span>
        </div>
        <Button size="sm">+ New Show</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {['Total riders', 'Entries sold', 'Horses', 'Vendor spaces', 'Tests offered', 'Revenue (all-in)'].map(
          (label) => (
            <div key={label} className="rounded-lg border border-line bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[.1em] text-fa-muted">{label}</div>
              <div className="mt-1 text-xl font-semibold text-forest">—</div>
              <div className="mt-0.5 text-[11px] text-fa-muted">this show</div>
            </div>
          )
        )}
      </div>
    </WorkspaceFrame>
  );
}

const JUDGE_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'My Assignments', active: true },
  { icon: UsersIcon, label: 'Panel & Contacts' },
  { icon: FileTextIcon, label: 'Documents' },
  { icon: HistoryIcon, label: 'History' },
];

/** Sample of judge-scribe.html's real-mode "My Assignments" — seeded, not fetched. */
export function JudgeScribePreview() {
  return (
    <WorkspaceFrame
      roleLabel="Judge workspace"
      navItems={JUDGE_NAV}
      liveToday
      footer={
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[rgba(251,250,247,.4)]">
            Signed in as
          </div>
          <div className="font-semibold text-paper">Margaret Ellison</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-2xl font-medium text-forest`}>My Assignments</h1>
          <p className="text-sm text-fa-muted">Today&apos;s ring times and every show you&apos;re on the panel for.</p>
        </div>
        <Badge variant="outline" className="flex-none">
          Judge · 3 upcoming
        </Badge>
      </div>

      <RingStatusBar rings={[{ label: 'Ring 1', offset: '+6m' }]} />
      <Button size="sm" variant="outline" className="mb-4">
        View results
      </Button>

      <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-fa-muted">
        Today&apos;s ring times
      </div>
      <div className="space-y-2">
        {[
          { time: '8:00 AM', cls: 'Training Level Test 3', partner: 'Emily Carter (Scribe)', badge: 'Today' },
          { time: '9:15 AM', cls: 'First Level Test 1', partner: 'Emily Carter (Scribe)', badge: 'Today' },
        ].map((row) => (
          <div
            key={row.cls}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-l-4 border-l-gold border-y border-r border-line bg-white px-3 py-2.5"
          >
            <div>
              <div className="text-sm font-semibold text-forest">
                {row.time} · {row.cls}
              </div>
              <div className="text-xs text-fa-muted">
                Autumn Leaves Dressage Classic · Ring 1 · with {row.partner}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Judge</Badge>
              <Badge>{row.badge}</Badge>
              <Button size="sm">Launch scoring</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-[.1em] text-fa-muted">Upcoming</div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5">
        <div>
          <div className="text-sm font-semibold text-forest">Chattahoochee Fall Classic</div>
          <div className="text-xs text-fa-muted">Sun, Aug 2 · Ring 2 · Second Level Test 2</div>
        </div>
        <Badge variant="outline">Upcoming</Badge>
      </div>
    </WorkspaceFrame>
  );
}

const ANNOUNCER_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'My Assignments', active: true },
  { icon: Volume2Icon, label: 'Rings' },
  { icon: CalendarIcon, label: 'Schedule' },
  { icon: ContactIcon, label: 'Contacts' },
  { icon: HistoryIcon, label: 'History' },
];

/** Sample of announcer.html's real-mode ring board — seeded, not fetched. */
export function AnnouncerPreview() {
  return (
    <WorkspaceFrame
      roleLabel="Announcer workspace"
      navItems={ANNOUNCER_NAV}
      liveToday
      footer={
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[rgba(251,250,247,.4)]">
            Signed in as
          </div>
          <div className="font-semibold text-paper">Tom Ruiz</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-2xl font-medium text-forest`}>My Assignments</h1>
          <p className="text-sm text-fa-muted">Every show you&apos;re announcing, past and upcoming.</p>
        </div>
        <Badge variant="outline" className="flex-none">
          2 upcoming
        </Badge>
      </div>

      <RingStatusBar
        rings={[
          { label: 'Ring 1', offset: '+6m' },
          { label: 'Ring 2', offset: '-2m' },
          { label: 'Ring 3', offset: '±0m' },
        ]}
      />

      <div className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-fa-muted">Upcoming &amp; today</div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-l-4 border-l-gold border-y border-r border-line bg-white px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-forest">Autumn Leaves Dressage Classic</div>
            <div className="text-xs text-fa-muted">Peachtree Dressage Assoc. · Sat, Jul 11 · Ring 1</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Today</Badge>
            <Button size="sm">Open live feed</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-forest">Chattahoochee Fall Classic</div>
            <div className="text-xs text-fa-muted">Chattahoochee Equestrian Center · Sun, Aug 2 · Ring 2</div>
          </div>
          <Badge variant="outline">Upcoming</Badge>
        </div>
      </div>
    </WorkspaceFrame>
  );
}

const VENDOR_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'My Bookings', active: true },
  { icon: SearchIcon, label: 'Discover Shows' },
  { icon: FileTextIcon, label: 'Documents' },
  { icon: HistoryIcon, label: 'History' },
];

/** Sample of vendor.html's real-mode "My Bookings" — the vendor's own dashboard, seeded, not fetched. */
export function VendorBookingsPreview() {
  return (
    <WorkspaceFrame
      roleLabel="Vendor workspace"
      navItems={VENDOR_NAV}
      footer={
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[.14em] text-[rgba(251,250,247,.4)]">
            Signed in as
          </div>
          <div className="font-semibold text-paper">Blue Ridge Tack Co.</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-2xl font-medium text-forest`}>My Bookings</h1>
          <p className="text-sm text-fa-muted">Every booth space you&apos;ve reserved, across every show and organizer.</p>
        </div>
        <Badge variant="outline" className="flex-none">
          2 upcoming
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border-l-4 border-l-green-600 border-y border-r border-line bg-white p-3.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-forest">Autumn Leaves Dressage Classic</div>
              <div className="text-xs text-fa-muted">Peachtree Dressage Assoc. · Sat, Jul 11</div>
            </div>
            <div className="flex gap-1.5">
              <Badge>Confirmed</Badge>
              <Badge variant="outline">Paid</Badge>
            </div>
          </div>
          <div className="space-y-1 border-t border-line pt-2 text-sm">
            <div className="flex justify-between text-fa-muted">
              <span>Vendor tent</span>
              <span>$250</span>
            </div>
            <div className="flex justify-between text-fa-muted">
              <span>Electricity — 30 amp</span>
              <span>$25</span>
            </div>
            <div className="flex justify-between font-semibold text-forest">
              <span>Total</span>
              <span>$275</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-l-gold border-y border-r border-line bg-white p-3.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-forest">Chattahoochee Fall Classic</div>
              <div className="text-xs text-fa-muted">Chattahoochee Equestrian Center · Sun, Aug 2</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline">Payment pending</Badge>
              <Button size="sm">Pay now</Button>
            </div>
          </div>
          <div className="space-y-1 border-t border-line pt-2 text-sm">
            <div className="flex justify-between text-fa-muted">
              <span>Inside vendor &amp; exhibitor building</span>
              <span>$650</span>
            </div>
            <div className="flex justify-between font-semibold text-forest">
              <span>Total</span>
              <span>$650</span>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceFrame>
  );
}
