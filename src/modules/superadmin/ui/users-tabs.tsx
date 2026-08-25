'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

type TabKey = 'superadmins' | 'directory';

export function UsersTabs({
  superAdmins,
  directory,
}: {
  superAdmins: ReactNode;
  directory: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>('superadmins');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'superadmins', label: 'Super Admins' },
    { key: 'directory', label: 'Organizer Staff Directory' },
  ];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Users" className="flex flex-wrap gap-2">
        {tabs.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
            }}
            className={cn(
              'h-auto rounded-full px-4 py-2 text-[13.5px] font-bold transition-colors hover:bg-transparent',
              tab === key
                ? 'bg-hunter-deep text-white'
                : 'border-line-strong text-hunter-deep hover:border-hunter-deep border',
            )}
          >
            {label}
          </Button>
        ))}
      </div>

      <div role="tabpanel">{tab === 'superadmins' ? superAdmins : directory}</div>
    </div>
  );
}
