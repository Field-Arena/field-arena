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
        'mb-[22px] flex flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-[#E9EDEB] bg-[#F4F7F5] p-1',
        className,
      )}
    >
      {sections.map((tab) => {
        const isActive = tab.key === activeKey;
        if (tab.disabled) {
          return (
            <span
              key={tab.key}
              className="flex-none cursor-default rounded-full px-3.5 py-[9px] text-[13.5px] font-medium whitespace-nowrap text-[#B8C2BD]"
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
                ? 'bg-forest flex-none rounded-full px-3.5 py-[9px] text-[13.5px] font-bold whitespace-nowrap text-white shadow-sm'
                : 'flex-none rounded-full px-3.5 py-[9px] text-[13.5px] font-medium whitespace-nowrap text-[#6E7C76] transition-colors hover:bg-white hover:text-[#2B3B33]'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
