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
    <div className="mx-auto flex max-w-4xl overflow-hidden rounded-xl border border-[#E7EAEE]">
      <aside className="flex w-[220px] flex-none flex-col bg-[#146A47] px-3 pt-5 pb-4 text-white">
        <div className="mb-1 flex items-center gap-2 px-2">
          <span
            className={`grid size-7 flex-none place-items-center rounded-md bg-[#146A47] ${DISPLAY} text-xs font-semibold text-white`}
          >
            F&amp;A
          </span>
          <span className={`${DISPLAY} text-[14px] font-medium text-white`}>Field &amp; Arena</span>
        </div>
        <div className="mb-4 px-2 text-[9.5px] font-bold tracking-[.08em] text-[#146A47] uppercase">
          {roleLabel}
        </div>
        {liveToday && (
          <div className="text-mint mb-3 flex items-center gap-1.5 px-2 text-[10.5px] font-bold tracking-[.1em] uppercase">
            <span className="size-1.5 rounded-full bg-[#EAF5EF]" aria-hidden />
            Live today
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold ${
                item.active ? 'bg-[#0E5537] text-white' : 'text-[rgba(251,250,247,.66)]'
              }`}
            >
              <item.icon
                className={`size-4 flex-none ${item.active ? 'text-[#146A47]' : ''}`}
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
      <div className="min-w-0 flex-1 bg-[#F5F7F8] p-6">{children}</div>
    </div>
  );
}
