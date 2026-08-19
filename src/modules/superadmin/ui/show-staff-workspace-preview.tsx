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
          <div className="mb-1 text-[9.5px] font-bold tracking-[.14em] text-[rgba(251,250,247,.4)] uppercase">
            Viewing as
          </div>
          <div className="text-paper rounded-md border border-[rgba(255,255,255,.15)] bg-[#17402F] px-2.5 py-1.5 font-semibold">
            Organizer
          </div>
        </div>
      }
    >
      <h1 className={`${DISPLAY} text-forest text-2xl font-medium`}>Dashboard</h1>
      <p className="text-fa-muted mb-4 text-sm">Everything across your shows, in one place.</p>

      <div className="border-line bg-mint/30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-gold size-2 rounded-full" aria-hidden />
          <span className="text-forest font-semibold">Peachtree Dressage Association</span>
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
          <div key={label} className="border-line rounded-lg border bg-white p-3">
            <div className="text-fa-muted text-[10px] font-bold tracking-[.1em] uppercase">
              {label}
            </div>
            <div className="text-forest mt-1 text-xl font-semibold">—</div>
            <div className="text-fa-muted mt-0.5 text-[11px]">this show</div>
          </div>
        ))}
      </div>
    </WorkspaceFrame>
  );
}
