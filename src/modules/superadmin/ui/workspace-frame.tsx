import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';

export interface WorkspaceNavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

export function WorkspaceFrame({
  roleLabel,
  navItems,
  footer,
  liveToday,
  children,
}: {
  roleLabel: string;
  navItems: WorkspaceNavItem[];

  footer: ReactNode;
  liveToday?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="border-line mx-auto flex max-w-4xl overflow-hidden rounded-xl border">
      <aside className="bg-forest text-paper flex w-[220px] flex-none flex-col px-3 pt-5 pb-4">
        <div className="mb-1 flex items-center gap-2 px-2">
          <span
            className={`bg-gold grid size-7 flex-none place-items-center rounded-md ${DISPLAY} text-forest text-xs font-semibold`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-paper text-[14px] font-medium`}>Field &amp; Arena</span>
        </div>
        <div className="text-gold mb-4 px-2 text-[9.5px] font-bold tracking-[.16em] uppercase">
          {roleLabel}
        </div>
        {liveToday && (
          <div className="text-mint mb-3 flex items-center gap-1.5 px-2 text-[10.5px] font-bold tracking-[.1em] uppercase">
            <span className="bg-mint size-1.5 rounded-full" aria-hidden />
            Live today
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold ${
                item.active ? 'text-paper bg-[#17402F]' : 'text-[rgba(251,250,247,.66)]'
              }`}
            >
              <item.icon
                className={`size-4 flex-none ${item.active ? 'text-gold' : ''}`}
                aria-hidden
              />
              {item.label}
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t border-[rgba(255,255,255,.1)] pt-3 text-[11.5px] text-[rgba(251,250,247,.66)]">
          {footer}
        </div>
      </aside>
      <div className="bg-paper min-w-0 flex-1 p-6">{children}</div>
    </div>
  );
}
