import { FileTextIcon, HistoryIcon, LayoutGridIcon, SearchIcon } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';
import { WorkspaceFrame, type WorkspaceNavItem } from '@/modules/superadmin/ui/workspace-frame';

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
