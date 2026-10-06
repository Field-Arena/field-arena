import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

export interface TabStripSection {
  key: string;
  label: string;
  href: string;
  disabled?: boolean;
}

export function TabStrip({
  sections,
  activeKey,
  className,
}: {
  sections: TabStripSection[];
  activeKey: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-5 flex [scrollbar-width:none] flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden border-b border-[#E7EAEE] px-0.5 [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {sections.map((tab) => {
        const isActive = tab.key === activeKey;
        if (tab.disabled) {
          return (
            <span
              key={tab.key}
              className="flex-none cursor-default px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap text-[#C3CAD3]"
              title="Coming soon"
            >
              {tab.label}
            </span>
          );
        }
        return (
          <Link
            key={tab.key}
            href={tab.href}
            prefetch={false}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? "relative flex-none px-3.5 py-3 text-[13.5px] font-semibold whitespace-nowrap text-[#146A47] after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-sm after:bg-[#146A47] after:content-['']"
                : 'flex-none px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap text-[#475467] transition-colors hover:text-[#101828]'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
