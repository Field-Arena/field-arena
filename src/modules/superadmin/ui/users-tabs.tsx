'use client';

import { useState, type ReactNode } from 'react';

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
  const [tab, setTab] = useState<TabKey>(initialTab ?? 'superadmins');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'superadmins', label: 'Super Admins' },
    { key: 'directory', label: 'Organizer Staff Directory' },
  ];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Users" className="fa-subtoggle !mb-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
            }}
            className={tab === key ? 'fa-active' : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">{tab === 'superadmins' ? superAdmins : directory}</div>
    </div>
  );
}
