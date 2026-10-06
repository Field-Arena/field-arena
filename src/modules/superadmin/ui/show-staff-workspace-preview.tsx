import {
  CalendarIcon,
  DatabaseIcon,
  DollarSignIcon,
  LayoutGridIcon,
  MapPinIcon,
  PawPrintIcon,
  PencilIcon,
  ShoppingBagIcon,
  UsersIcon,
} from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';
import { WorkspaceFrame, type WorkspaceNavItem } from '@/modules/superadmin/ui/workspace-frame';

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

export function ShowStaffWorkspacePreview() {
  return (
    <WorkspaceFrame
      roleLabel="Organizer workspace"
      navItems={SHOWADMIN_NAV}
      footer={
        <div>
          <div className="mb-1 text-[9.5px] font-bold tracking-[.08em] text-[rgba(251,250,247,.4)] uppercase">
            Viewing as
          </div>
          <div className="rounded-md border border-[rgba(255,255,255,.15)] bg-[#0E5537] px-2.5 py-1.5 font-semibold text-white">
            Organizer
          </div>
        </div>
      }
    >
      <h1 className={`${DISPLAY} text-2xl font-medium text-[#101828]`}>Dashboard</h1>
      <p className="mb-4 text-sm text-[#475467]">Everything across your shows, in one place.</p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7EAEE] bg-[#EAF5EF]/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#146A47]" aria-hidden />
          <span className="font-semibold text-[#101828]">Peachtree Dressage Association</span>
        </div>
        <Button size="sm">+ New Show</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          'Total riders',
          'Entries sold',
          'Horses',
          'Vendor spaces',
          'Tests offered',
          'Revenue (all-in)',
        ].map((label) => (
          <div key={label} className="rounded-lg border border-[#E7EAEE] bg-white p-3">
            <div className="text-[10px] font-bold tracking-[.1em] text-[#475467] uppercase">
              {label}
            </div>
            <div className="mt-1 text-xl font-semibold text-[#101828]">—</div>
            <div className="mt-0.5 text-[11px] text-[#475467]">this show</div>
          </div>
        ))}
      </div>
    </WorkspaceFrame>
  );
}
