'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/shadcn/tabs';

type TabKey = 'superadmins' | 'directory';

export function UsersTabs({
  superAdmins,
  directory,
  initialTab,
}: {
  superAdmins: ReactNode;
  directory: ReactNode;
  initialTab?: TabKey;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'superadmins', label: 'Super Admins' },
    { key: 'directory', label: 'Organizer Staff Directory' },
  ];

  return (
    <Tabs defaultValue={initialTab ?? 'superadmins'} className="gap-5">
      <TabsList
        aria-label="Users"
        className="h-auto max-w-full flex-wrap justify-start gap-2 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto"
      >
        {tabs.map(({ key, label }) => (
          <TabsTrigger
            key={key}
            value={key}
            className="border-line-strong text-hunter-deep hover:border-hunter-deep data-[state=active]:bg-hunter-deep h-auto flex-none rounded-full border px-4 py-2 text-[13.5px] font-bold whitespace-normal transition-colors data-[state=active]:text-white"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="superadmins">{superAdmins}</TabsContent>
      <TabsContent value="directory">{directory}</TabsContent>
    </Tabs>
  );
}
