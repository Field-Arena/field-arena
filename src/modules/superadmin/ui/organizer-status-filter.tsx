import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

export interface OrganizerStatusCounts {
  all: number;
  onboard: number;
  pending: number;
}

export function OrganizerStatusFilter({
  active,
  counts,
  q,
}: {
  active: 'all' | 'onboard' | 'pending';
  counts: OrganizerStatusCounts;
  q?: string;
}) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'onboard', label: 'Onboard', count: counts.onboard },
    { key: 'pending', label: 'Pending', count: counts.pending },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (tab.key !== 'all') params.set('status', tab.key);
        const query = params.toString();

        return (
          <Link
            key={tab.key}
            href={query ? `/dashboard/superadmin?${query}` : '/dashboard/superadmin'}
            scroll={false}
            className={cn(
              'inline-flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-semibold transition-colors',
              active === tab.key
                ? 'bg-forest text-paper'
                : 'border-line text-forest hover:border-gold border bg-white',
            )}
          >
            {tab.label} {tab.count}
          </Link>
        );
      })}
    </div>
  );
}
