import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DISPLAY } from '@/modules/superadmin/ui/signup-preview-styles';

export interface WorkspaceNavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

/**
 * Shared workspace chrome — sidebar + live clock, reused by the 4 role
 * previews so their content areas can focus on what's role-specific.
 */
export function WorkspaceFrame({
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
