import { CalendarIcon, ContactIcon, HistoryIcon, LayoutGridIcon, Volume2Icon } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';
import { WorkspaceFrame, type WorkspaceNavItem } from '@/modules/superadmin/ui/workspace-frame';
import { RingStatusBar } from '@/modules/superadmin/ui/ring-status-bar';

const ANNOUNCER_NAV: WorkspaceNavItem[] = [
  { icon: LayoutGridIcon, label: 'My Assignments', active: true },
  { icon: Volume2Icon, label: 'Rings' },
  { icon: CalendarIcon, label: 'Schedule' },
  { icon: ContactIcon, label: 'Contacts' },
  { icon: HistoryIcon, label: 'History' },
];

export function AnnouncerPreview() {
  return (
    <WorkspaceFrame
      roleLabel="Announcer workspace"
      navItems={ANNOUNCER_NAV}
      liveToday
      footer={
        <div>
          <div className="text-[9.5px] font-bold tracking-[.14em] text-[rgba(251,250,247,.4)] uppercase">
            Signed in as
          </div>
          <div className="text-paper font-semibold">Tom Ruiz</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-forest text-2xl font-medium`}>My Assignments</h1>
          <p className="text-fa-muted text-sm">
            Every show you&apos;re announcing, past and upcoming.
          </p>
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

      <div className="text-fa-muted mb-2 text-xs font-bold tracking-[.1em] uppercase">
        Upcoming &amp; today
      </div>
      <div className="space-y-2">
        <div className="border-l-gold border-line flex flex-wrap items-center justify-between gap-2 rounded-lg border-y border-r border-l-4 bg-white px-3 py-2.5">
          <div>
            <div className="text-forest text-sm font-semibold">Autumn Leaves Dressage Classic</div>
            <div className="text-fa-muted text-xs">
              Peachtree Dressage Assoc. · Sat, Jul 11 · Ring 1
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Today</Badge>
            <Button size="sm">Open live feed</Button>
          </div>
        </div>
        <div className="border-line flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5">
          <div>
            <div className="text-forest text-sm font-semibold">Chattahoochee Fall Classic</div>
            <div className="text-fa-muted text-xs">
              Chattahoochee Equestrian Center · Sun, Aug 2 · Ring 2
            </div>
          </div>
          <Badge variant="outline">Upcoming</Badge>
        </div>
      </div>
    </WorkspaceFrame>
  );
}
