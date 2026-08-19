import { FileTextIcon, HistoryIcon, LayoutGridIcon, UsersIcon } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';
import { WorkspaceFrame, type WorkspaceNavItem } from '@/modules/superadmin/ui/workspace-frame';
import { RingStatusBar } from '@/modules/superadmin/ui/ring-status-bar';

const JUDGE_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'My Assignments', active: true },
  { icon: UsersIcon, label: 'Panel & Contacts' },
  { icon: FileTextIcon, label: 'Documents' },
  { icon: HistoryIcon, label: 'History' },
];

export function JudgeScribePreview() {
  return (
    <WorkspaceFrame
      roleLabel="Judge workspace"
      navItems={JUDGE_NAV}
      liveToday
      footer={
        <div>
          <div className="text-[9.5px] font-bold tracking-[.14em] text-[rgba(251,250,247,.4)] uppercase">
            Signed in as
          </div>
          <div className="text-paper font-semibold">Margaret Ellison</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-forest text-2xl font-medium`}>My Assignments</h1>
          <p className="text-fa-muted text-sm">
            Today&apos;s ring times and every show you&apos;re on the panel for.
          </p>
        </div>
        <Badge variant="outline" className="flex-none">
          Judge · 3 upcoming
        </Badge>
      </div>

      <RingStatusBar rings={[{ label: 'Ring 1', offset: '+6m' }]} />
      <Button size="sm" variant="outline" className="mb-4">
        View results
      </Button>

      <div className="text-fa-muted mb-2 text-xs font-bold tracking-[.1em] uppercase">
        Today&apos;s ring times
      </div>
      <div className="space-y-2">
        {[
          {
            time: '8:00 AM',
            cls: 'Training Level Test 3',
            partner: 'Emily Carter (Scribe)',
            badge: 'Today',
          },
          {
            time: '9:15 AM',
            cls: 'First Level Test 1',
            partner: 'Emily Carter (Scribe)',
            badge: 'Today',
          },
        ].map((row) => (
          <div
            key={row.cls}
            className="border-l-gold border-line flex flex-wrap items-center justify-between gap-2 rounded-lg border-y border-r border-l-4 bg-white px-3 py-2.5"
          >
            <div>
              <div className="text-forest text-sm font-semibold">
                {row.time} · {row.cls}
              </div>
              <div className="text-fa-muted text-xs">
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

      <div className="text-fa-muted mt-4 mb-2 text-xs font-bold tracking-[.1em] uppercase">
        Upcoming
      </div>
      <div className="border-line flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5">
        <div>
          <div className="text-forest text-sm font-semibold">Chattahoochee Fall Classic</div>
          <div className="text-fa-muted text-xs">Sun, Aug 2 · Ring 2 · Second Level Test 2</div>
        </div>
        <Badge variant="outline">Upcoming</Badge>
      </div>
    </WorkspaceFrame>
  );
}
