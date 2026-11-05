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
          <div className="text-[9.5px] font-bold tracking-[.08em] text-[rgba(251,250,247,.4)] uppercase">
            Signed in as
          </div>
          <div className="font-semibold text-white">Tom Ruiz</div>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className={`${DISPLAY} text-2xl font-medium text-[#101828]`}>My Assignments</h1>
          <p className="text-sm text-[#475467]">
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

      <div className="mb-2 text-xs font-bold tracking-[.1em] text-[#475467] uppercase">
        Upcoming &amp; today
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-y border-r border-l-4 border-[#E7EAEE] border-l-[#146A47] bg-white px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-[#101828]">
              Autumn Leaves Dressage Classic
            </div>
            <div className="text-xs text-[#475467]">
              Peachtree Dressage Assoc. · Sat, Jul 11 · Ring 1
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Today</Badge>
            <Button size="sm">Open live feed</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E7EAEE] bg-white px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-[#101828]">Chattahoochee Fall Classic</div>
            <div className="text-xs text-[#475467]">
              Chattahoochee Equestrian Center · Sun, Aug 2 · Ring 2
            </div>
          </div>
          <Badge variant="outline">Upcoming</Badge>
        </div>
      </div>
    </WorkspaceFrame>
  );
}
